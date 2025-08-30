import MiroClient from '../client.js';
import { z } from 'zod';
import { ServerResponse } from '../server-response.js';
import { ToolSchema } from '../tool.js';

// Base update schemas for different item types
const stickyNoteUpdateSchema = z.object({
  type: z.literal("sticky_note"),
  itemId: z.string().describe("ID of the sticky note to update"),
  data: z.object({
    content: z.string().optional().describe("Updated text content"),
    shape: z.enum(["square", "rectangle"]).optional().describe("Updated shape")
  }).optional(),
  position: z.object({
    x: z.number().optional().describe("Updated X coordinate"),
    y: z.number().optional().describe("Updated Y coordinate")
  }).optional(),
  geometry: z.object({
    width: z.number().optional().describe("Updated width"),
    height: z.number().optional().describe("Updated height")
  }).optional(),
  style: z.object({
    fillColor: z.string().optional().describe("Updated fill color"),
    textAlign: z.enum(["left", "center", "right"]).optional().describe("Updated text alignment"),
    textColor: z.string().optional().describe("Updated text color")
  }).optional()
});

const cardUpdateSchema = z.object({
  type: z.literal("card"),
  itemId: z.string().describe("ID of the card to update"),
  data: z.object({
    title: z.string().optional().describe("Updated title"),
    description: z.string().optional().describe("Updated description"),
    assigneeId: z.string().optional().describe("Updated assignee ID"),
    dueDate: z.string().optional().describe("Updated due date (ISO 8601 format)")
  }).optional(),
  position: z.object({
    x: z.number().optional().describe("Updated X coordinate"),
    y: z.number().optional().describe("Updated Y coordinate")
  }).optional(),
  geometry: z.object({
    width: z.number().optional().describe("Updated width"),
    height: z.number().optional().describe("Updated height"),
    rotation: z.number().optional().describe("Updated rotation angle")
  }).optional(),
  style: z.object({
    cardTheme: z.string().optional().describe("Updated card color")
  }).optional()
});

const textUpdateSchema = z.object({
  type: z.literal("text"),
  itemId: z.string().describe("ID of the text item to update"),
  data: z.object({
    content: z.string().optional().describe("Updated text content")
  }).optional(),
  position: z.object({
    x: z.number().optional().describe("Updated X coordinate"),
    y: z.number().optional().describe("Updated Y coordinate")
  }).optional(),
  geometry: z.object({
    width: z.number().optional().describe("Updated width")
  }).optional(),
  style: z.object({
    color: z.string().optional().describe("Updated text color"),
    fontSize: z.number().optional().describe("Updated font size"),
    textAlign: z.enum(["left", "center", "right"]).optional().describe("Updated text alignment")
  }).optional()
});

const shapeUpdateSchema = z.object({
  type: z.literal("shape"),
  itemId: z.string().describe("ID of the shape to update"),
  data: z.object({
    shape: z.string().optional().describe("Updated shape type"),
    content: z.string().optional().describe("Updated text content inside shape")
  }).optional(),
  position: z.object({
    x: z.number().optional().describe("Updated X coordinate"),
    y: z.number().optional().describe("Updated Y coordinate")
  }).optional(),
  geometry: z.object({
    width: z.number().optional().describe("Updated width"),
    height: z.number().optional().describe("Updated height"),
    rotation: z.number().optional().describe("Updated rotation angle")
  }).optional(),
  style: z.object({
    borderColor: z.string().optional().describe("Updated border color"),
    borderWidth: z.number().optional().describe("Updated border width"),
    borderStyle: z.string().optional().describe("Updated border style"),
    borderOpacity: z.number().optional().describe("Updated border opacity"),
    fillColor: z.string().optional().describe("Updated fill color"),
    fillOpacity: z.number().optional().describe("Updated fill opacity"),
    color: z.string().optional().describe("Updated text color")
  }).optional()
});

const frameUpdateSchema = z.object({
  type: z.literal("frame"),
  itemId: z.string().describe("ID of the frame to update"),
  data: z.object({
    title: z.string().optional().describe("Updated frame title"),
    format: z.string().optional().describe("Updated frame format"),
    type: z.string().optional().describe("Updated frame type"),
    showContent: z.boolean().optional().describe("Updated content visibility")
  }).optional(),
  position: z.object({
    x: z.number().optional().describe("Updated X coordinate"),
    y: z.number().optional().describe("Updated Y coordinate")
  }).optional(),
  geometry: z.object({
    width: z.number().optional().describe("Updated width"),
    height: z.number().optional().describe("Updated height")
  }).optional(),
  style: z.object({
    fillColor: z.string().optional().describe("Updated fill color")
  }).optional()
});

const appCardUpdateSchema = z.object({
  type: z.literal("app_card"),
  itemId: z.string().describe("ID of the app card to update"),
  data: z.object({
    title: z.string().optional().describe("Updated title"),
    description: z.string().optional().describe("Updated description"),
    status: z.string().optional().describe("Updated status"),
    fields: z.array(z.object({
      value: z.string().describe("Field value"),
      iconShape: z.string().optional().describe("Icon shape"),
      fillColor: z.string().optional().describe("Fill color"),
      textColor: z.string().optional().describe("Text color")
    })).optional().describe("Updated custom fields")
  }).optional(),
  position: z.object({
    x: z.number().optional().describe("Updated X coordinate"),
    y: z.number().optional().describe("Updated Y coordinate")
  }).optional(),
  geometry: z.object({
    width: z.number().optional().describe("Updated width"),
    height: z.number().optional().describe("Updated height")
  }).optional()
});

const documentUpdateSchema = z.object({
  type: z.literal("document"),
  itemId: z.string().describe("ID of the document to update"),
  data: z.object({
    url: z.string().optional().describe("Updated document URL"),
    title: z.string().optional().describe("Updated document title")
  }).optional(),
  position: z.object({
    x: z.number().optional().describe("Updated X coordinate"),
    y: z.number().optional().describe("Updated Y coordinate")
  }).optional(),
  geometry: z.object({
    width: z.number().optional().describe("Updated width"),
    height: z.number().optional().describe("Updated height")
  }).optional()
});

const imageUpdateSchema = z.object({
  type: z.literal("image"),
  itemId: z.string().describe("ID of the image to update"),
  data: z.object({
    title: z.string().optional().describe("Updated image title")
  }).optional(),
  position: z.object({
    x: z.number().optional().describe("Updated X coordinate"),
    y: z.number().optional().describe("Updated Y coordinate"),
    origin: z.string().optional().describe("Updated origin"),
    relativeTo: z.string().optional().describe("Updated relative positioning")
  }).optional(),
  geometry: z.object({
    width: z.number().optional().describe("Updated width"),
    height: z.number().optional().describe("Updated height")
  }).optional()
});

const embedUpdateSchema = z.object({
  type: z.literal("embed"),
  itemId: z.string().describe("ID of the embed to update"),
  data: z.object({
    mode: z.string().optional().describe("Updated embed mode")
  }).optional(),
  position: z.object({
    x: z.number().optional().describe("Updated X coordinate"),
    y: z.number().optional().describe("Updated Y coordinate"),
    origin: z.string().optional().describe("Updated origin"),
    relativeTo: z.string().optional().describe("Updated relative positioning")
  }).optional(),
  geometry: z.object({
    width: z.number().optional().describe("Updated width"),
    height: z.number().optional().describe("Updated height")
  }).optional()
});

const connectorUpdateSchema = z.object({
  type: z.literal("connector"),
  connectorId: z.string().describe("ID of the connector to update"),
  startItem: z.object({
    id: z.string().describe("ID of the start item")
  }).optional(),
  endItem: z.object({
    id: z.string().describe("ID of the end item")
  }).optional(),
  style: z.object({
    strokeColor: z.string().optional().describe("Updated stroke color"),
    strokeWidth: z.number().optional().describe("Updated stroke width"),
    strokeStyle: z.string().optional().describe("Updated stroke style"),
    startStrokeCap: z.string().optional().describe("Updated start stroke cap"),
    endStrokeCap: z.string().optional().describe("Updated end stroke cap")
  }).optional()
});

const updateItemsInBulkSchema = z.object({
  boardId: z.string().describe("Board ID where items will be updated"),
  items: z.array(z.discriminatedUnion("type", [
    stickyNoteUpdateSchema,
    cardUpdateSchema,
    textUpdateSchema,
    shapeUpdateSchema,
    frameUpdateSchema,
    appCardUpdateSchema,
    documentUpdateSchema,
    imageUpdateSchema,
    embedUpdateSchema,
    connectorUpdateSchema
  ])).describe("Array of items to update")
});

// Helper functions for updating different item types
async function updateStickyNote(boardId: string, item: z.infer<typeof stickyNoteUpdateSchema>) {
  const updateData: any = {};
  if (item.data) updateData.data = item.data;
  if (item.position) updateData.position = item.position;
  if (item.geometry) updateData.geometry = item.geometry;
  if (item.style) updateData.style = item.style;
  
  return await MiroClient.getApi().updateStickyNoteItem(boardId, item.itemId, updateData);
}

async function updateCard(boardId: string, item: z.infer<typeof cardUpdateSchema>) {
  const updateData: any = {};
  if (item.data) updateData.data = item.data;
  if (item.position) updateData.position = item.position;
  if (item.geometry) updateData.geometry = item.geometry;
  if (item.style) updateData.style = item.style;
  
  return await MiroClient.getApi().updateCardItem(boardId, item.itemId, updateData);
}

async function updateText(boardId: string, item: z.infer<typeof textUpdateSchema>) {
  const updateData: any = {};
  if (item.data) updateData.data = item.data;
  if (item.position) updateData.position = item.position;
  if (item.geometry) updateData.geometry = item.geometry;
  if (item.style) {
    updateData.style = { ...item.style };
    if (item.style.fontSize) {
      updateData.style.fontSize = item.style.fontSize.toString();
    }
  }
  
  return await MiroClient.getApi().updateTextItem(boardId, item.itemId, updateData);
}

async function updateShape(boardId: string, item: z.infer<typeof shapeUpdateSchema>) {
  const updateData: any = {};
  if (item.data) updateData.data = item.data;
  if (item.position) updateData.position = item.position;
  if (item.geometry) updateData.geometry = item.geometry;
  if (item.style) updateData.style = item.style;
  
  return await MiroClient.getApi().updateShapeItem(boardId, item.itemId, updateData);
}

async function updateFrame(boardId: string, item: z.infer<typeof frameUpdateSchema>) {
  const updateData: any = {};
  if (item.data) updateData.data = item.data;
  if (item.position) updateData.position = item.position;
  if (item.geometry) updateData.geometry = item.geometry;
  if (item.style) updateData.style = item.style;
  
  return await MiroClient.getApi().updateFrameItem(boardId, item.itemId, updateData);
}

async function updateAppCard(boardId: string, item: z.infer<typeof appCardUpdateSchema>) {
  const updateData: any = {};
  if (item.data) updateData.data = item.data;
  if (item.position) updateData.position = item.position;
  if (item.geometry) updateData.geometry = item.geometry;
  
  return await MiroClient.getApi().updateAppCardItem(boardId, item.itemId, updateData);
}

async function updateDocument(boardId: string, item: z.infer<typeof documentUpdateSchema>) {
  const updateData: any = {};
  if (item.data) updateData.data = item.data;
  if (item.position) updateData.position = item.position;
  if (item.geometry) updateData.geometry = item.geometry;
  
  return await MiroClient.getApi().updateDocumentItemUsingUrl(boardId, item.itemId, updateData);
}

async function updateImage(boardId: string, item: z.infer<typeof imageUpdateSchema>) {
  const updateData: any = {};
  if (item.data) updateData.data = item.data;
  if (item.position) updateData.position = item.position;
  if (item.geometry) updateData.geometry = item.geometry;
  
  return await MiroClient.getApi().updateImageItemUsingUrl(boardId, item.itemId, updateData);
}

async function updateEmbed(boardId: string, item: z.infer<typeof embedUpdateSchema>) {
  const updateData: any = {};
  if (item.data) updateData.data = item.data;
  if (item.position) updateData.position = item.position;
  if (item.geometry) updateData.geometry = item.geometry;
  
  return await MiroClient.getApi().updateEmbedItem(boardId, item.itemId, updateData);
}

async function updateConnector(boardId: string, item: z.infer<typeof connectorUpdateSchema>) {
  const updateData: any = {};
  if (item.startItem) updateData.startItem = item.startItem;
  if (item.endItem) updateData.endItem = item.endItem;
  if (item.style) {
    updateData.style = { ...item.style };
    if (item.style.strokeWidth) {
      updateData.style.strokeWidth = item.style.strokeWidth.toString();
    }
  }
  
  return await MiroClient.getApi().updateConnector(boardId, item.connectorId, updateData);
}

const updateItemsInBulkTool: ToolSchema = {
  name: "update-items-in-bulk",
  description: "Update multiple items on a Miro board in a single operation",
  args: {
    boardId: z.string().describe("Board ID where items will be updated"),
    items: z.array(z.discriminatedUnion("type", [
      stickyNoteUpdateSchema,
      cardUpdateSchema,
      textUpdateSchema,
      shapeUpdateSchema,
      frameUpdateSchema,
      appCardUpdateSchema,
      documentUpdateSchema,
      imageUpdateSchema,
      embedUpdateSchema,
      connectorUpdateSchema
    ])).describe("Array of items to update")
  },
  fn: async ({ boardId, items }) => {
    try {
      const results: any[] = [];
      const errors: any[] = [];

      for (const item of items) {
        try {
          let result;
          switch (item.type) {
            case "sticky_note":
              result = await updateStickyNote(boardId, item);
              break;
            case "card":
              result = await updateCard(boardId, item);
              break;
            case "text":
              result = await updateText(boardId, item);
              break;
            case "shape":
              result = await updateShape(boardId, item);
              break;
            case "frame":
              result = await updateFrame(boardId, item);
              break;
            case "app_card":
              result = await updateAppCard(boardId, item);
              break;
            case "document":
              result = await updateDocument(boardId, item);
              break;
            case "image":
              result = await updateImage(boardId, item);
              break;
            case "embed":
              result = await updateEmbed(boardId, item);
              break;
            case "connector":
              result = await updateConnector(boardId, item);
              break;
            default:
              throw new Error(`Unsupported item type: ${(item as any).type}`);
          }
          results.push(result);
        } catch (error) {
          errors.push({
            item: item,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const response = {
        success: true,
        message: `Updated ${results.length} items successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        updatedItems: results,
        errors: errors.length > 0 ? errors : undefined
      };

      return ServerResponse.text(JSON.stringify(response, null, 2));
    } catch (error) {
      return ServerResponse.error(error);
    }
  }
};

export default updateItemsInBulkTool;
