import MiroClient from '../client.js';
import { z } from 'zod';
import { ServerResponse } from '../server-response.js';
import { ToolSchema } from '../tool.js';

import { FrameCreateRequest } from '@mirohq/miro-api/dist/model/frameCreateRequest.js';
import { FrameChanges } from '@mirohq/miro-api/dist/model/frameChanges.js';
import { TextCreateRequest } from '@mirohq/miro-api/dist/model/textCreateRequest.js';
import { TextData } from '@mirohq/miro-api/dist/model/textData.js';
import { ConnectorCreationData } from '@mirohq/miro-api/dist/model/connectorCreationData.js';

const createTableTool: ToolSchema = {
  name: "create-table",
  description: "Create a table visualization on a Miro board using frames and text items",
  args: {
    boardId: z.string().describe("Unique identifier (ID) of the board where the table will be created"),
    data: z.object({
      headers: z.array(z.string()).describe("Array of column headers"),
      rows: z.array(z.array(z.string())).describe("Array of rows, each containing cell values"),
      title: z.string().optional().nullish().describe("Optional title for the table")
    }).describe("Table data structure"),
    position: z.object({
      x: z.number().describe("X coordinate of the table's top-left corner"),
      y: z.number().describe("Y coordinate of the table's top-left corner")
    }).describe("Position of the table on the board"),
    style: z.object({
      cellWidth: z.number().optional().nullish().describe("Width of each cell (default: 150)"),
      cellHeight: z.number().optional().nullish().describe("Height of each cell (default: 40)"),
      headerColor: z.string().optional().nullish().describe("Background color for header cells (hex format)"),
      cellColor: z.string().optional().nullish().describe("Background color for data cells (hex format)"),
      borderColor: z.string().optional().nullish().describe("Color for table borders (hex format)"),
      textColor: z.string().optional().nullish().describe("Text color (hex format)"),
      fontSize: z.number().optional().nullish().describe("Font size for text (default: 12)"),
      showBorders: z.boolean().optional().nullish().describe("Whether to show cell borders (default: true)")
    }).optional().nullish().describe("Styling options for the table")
  },
  fn: async ({ boardId, data, position, style }) => {
    try {
      if (!boardId) {
        return ServerResponse.error("Board ID is required");
      }

      if (!data.headers || data.headers.length === 0) {
        return ServerResponse.error("At least one header is required");
      }

      if (!data.rows || data.rows.length === 0) {
        return ServerResponse.error("At least one row is required");
      }

      // Validate that all rows have the same number of columns as headers
      for (let i = 0; i < data.rows.length; i++) {
        if (data.rows[i].length !== data.headers.length) {
          return ServerResponse.error(`Row ${i + 1} has ${data.rows[i].length} columns but expected ${data.headers.length}`);
        }
      }

      // Default styling
      const cellWidth = style?.cellWidth || 150;
      const cellHeight = style?.cellHeight || 40;
      const headerColor = style?.headerColor || '#4A90E2';
      const cellColor = style?.cellColor || '#F8F9FA';
      const borderColor = style?.borderColor || '#E1E5E9';
      const textColor = style?.textColor || '#000000';
      const fontSize = style?.fontSize || 12;
      const showBorders = style?.showBorders !== false;

      const results = [];
      const errors = [];
      let currentY = position.y;

      // Create title if provided
      if (data.title) {
        try {
          const titleResult = await createTableTitle(boardId, data.title, position.x, currentY - 30, cellWidth * data.headers.length, textColor, fontSize + 4);
          results.push({ type: 'title', item: titleResult });
        } catch (error) {
          errors.push({ type: 'title', error: error.message || String(error) });
        }
      }

      // Create header row
      for (let col = 0; col < data.headers.length; col++) {
        const cellX = position.x + (col * cellWidth);
        
        try {
          // Create header cell frame
          const headerFrame = await createTableCell(
            boardId, 
            cellX, 
            currentY, 
            cellWidth, 
            cellHeight, 
            headerColor,
            `Header-${col}`
          );
          results.push({ type: 'header-frame', column: col, item: headerFrame });

          // Create header text
          const headerText = await createTableText(
            boardId,
            data.headers[col],
            cellX + cellWidth / 2,
            currentY + cellHeight / 2,
            textColor,
            fontSize + 2,
            'center'
          );
          results.push({ type: 'header-text', column: col, item: headerText });
        } catch (error) {
          errors.push({ type: 'header', column: col, error: error.message || String(error) });
        }
      }

      currentY += cellHeight;

      // Create data rows
      for (let row = 0; row < data.rows.length; row++) {
        for (let col = 0; col < data.rows[row].length; col++) {
          const cellX = position.x + (col * cellWidth);
          const cellY = currentY + (row * cellHeight);

          try {
            // Create data cell frame
            const cellFrame = await createTableCell(
              boardId,
              cellX,
              cellY,
              cellWidth,
              cellHeight,
              cellColor,
              `Cell-${row}-${col}`
            );
            results.push({ type: 'cell-frame', row, column: col, item: cellFrame });

            // Create cell text
            const cellText = await createTableText(
              boardId,
              data.rows[row][col],
              cellX + cellWidth / 2,
              cellY + cellHeight / 2,
              textColor,
              fontSize,
              'center'
            );
            results.push({ type: 'cell-text', row, column: col, item: cellText });
          } catch (error) {
            errors.push({ type: 'cell', row, column: col, error: error.message || String(error) });
          }
        }
      }

      // Create borders if enabled
      if (showBorders) {
        try {
          const borderResults = await createTableBorders(
            boardId,
            position.x,
            position.y,
            cellWidth,
            cellHeight,
            data.headers.length,
            data.rows.length + 1, // +1 for header row
            borderColor
          );
          results.push(...borderResults.map(item => ({ type: 'border', item })));
        } catch (error) {
          errors.push({ type: 'borders', error: error.message || String(error) });
        }
      }

      return ServerResponse.text(JSON.stringify({
        success: true,
        created: results.length,
        failed: errors.length,
        table: {
          columns: data.headers.length,
          rows: data.rows.length,
          totalCells: data.headers.length * (data.rows.length + 1)
        },
        results,
        errors
      }, null, 2));

    } catch (error) {
      return ServerResponse.error(error);
    }
  }
}

// Helper function to create a table cell (frame)
async function createTableCell(
  boardId: string, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  fillColor: string,
  title: string
) {
  const createRequest = new FrameCreateRequest();
  
  const frameData = new FrameChanges();
  frameData.title = title;
  frameData.format = 'custom';
  frameData.type = 'freeform';
  
  createRequest.data = frameData;
  createRequest.position = { x, y };
  createRequest.geometry = { width, height };
  createRequest.style = { fillColor };

  return await MiroClient.getApi().createFrameItem(boardId, createRequest);
}

// Helper function to create table text
async function createTableText(
  boardId: string,
  content: string,
  x: number,
  y: number,
  color: string,
  fontSize: number,
  textAlign: string
) {
  const createRequest = new TextCreateRequest();
  
  const textData = new TextData();
  textData.content = content;
  
  createRequest.data = textData;
  createRequest.position = { x, y };
  createRequest.style = { color, fontSize: fontSize.toString(), textAlign };

  return await MiroClient.getApi().createTextItem(boardId, createRequest);
}

// Helper function to create table title
async function createTableTitle(
  boardId: string,
  title: string,
  x: number,
  y: number,
  width: number,
  color: string,
  fontSize: number
) {
  return await createTableText(
    boardId,
    title,
    x + width / 2,
    y,
    color,
    fontSize,
    'center'
  );
}

// Helper function to create table borders using connectors
async function createTableBorders(
  boardId: string,
  startX: number,
  startY: number,
  cellWidth: number,
  cellHeight: number,
  columns: number,
  rows: number,
  borderColor: string
) {
  const borders = [];
  
  // Note: This is a simplified border implementation
  // In a real implementation, you might want to create thin rectangle shapes
  // or use a different approach since connectors need start/end items
  
  // For now, we'll skip the border creation as it requires existing items to connect
  // This could be enhanced by creating small invisible shapes as anchor points
  
  return borders;
}

export default createTableTool;
