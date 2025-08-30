import MiroClient from '../client.js';
import { z } from 'zod';
import { ServerResponse } from '../server-response.js';
import { ToolSchema } from '../tool.js';

// Schema for items to delete
const deleteItemSchema = z.object({
  type: z.enum([
    "sticky_note", "card", "text", "shape", "frame", 
    "app_card", "document", "image", "embed", "connector"
  ]).describe("Type of item to delete"),
  itemId: z.string().describe("ID of the item to delete"),
  connectorId: z.string().optional().describe("ID of the connector to delete (only for connector type)")
});

const deleteItemsInBulkSchema = z.object({
  boardId: z.string().describe("Board ID where items will be deleted"),
  items: z.array(deleteItemSchema).describe("Array of items to delete")
});

// Helper functions for deleting different item types
async function deleteStickyNote(boardId: string, itemId: string) {
  return await MiroClient.getApi().deleteStickyNoteItem(boardId, itemId);
}

async function deleteCard(boardId: string, itemId: string) {
  return await MiroClient.getApi().deleteCardItem(boardId, itemId);
}

async function deleteText(boardId: string, itemId: string) {
  return await MiroClient.getApi().deleteTextItem(boardId, itemId);
}

async function deleteShape(boardId: string, itemId: string) {
  return await MiroClient.getApi().deleteShapeItem(boardId, itemId);
}

async function deleteFrame(boardId: string, itemId: string) {
  return await MiroClient.getApi().deleteFrameItem(boardId, itemId);
}

async function deleteAppCard(boardId: string, itemId: string) {
  return await MiroClient.getApi().deleteAppCardItem(boardId, itemId);
}

async function deleteDocument(boardId: string, itemId: string) {
  return await MiroClient.getApi().deleteDocumentItem(boardId, itemId);
}

async function deleteImage(boardId: string, itemId: string) {
  return await MiroClient.getApi().deleteImageItem(boardId, itemId);
}

async function deleteEmbed(boardId: string, itemId: string) {
  return await MiroClient.getApi().deleteEmbedItem(boardId, itemId);
}

async function deleteConnector(boardId: string, connectorId: string) {
  return await MiroClient.getApi().deleteConnector(boardId, connectorId);
}

const deleteItemsInBulkTool: ToolSchema = {
  name: "delete-items-in-bulk",
  description: "Delete multiple items from a Miro board in a single operation",
  args: {
    boardId: z.string().describe("Board ID where items will be deleted"),
    items: z.array(deleteItemSchema).describe("Array of items to delete")
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
              result = await deleteStickyNote(boardId, item.itemId);
              break;
            case "card":
              result = await deleteCard(boardId, item.itemId);
              break;
            case "text":
              result = await deleteText(boardId, item.itemId);
              break;
            case "shape":
              result = await deleteShape(boardId, item.itemId);
              break;
            case "frame":
              result = await deleteFrame(boardId, item.itemId);
              break;
            case "app_card":
              result = await deleteAppCard(boardId, item.itemId);
              break;
            case "document":
              result = await deleteDocument(boardId, item.itemId);
              break;
            case "image":
              result = await deleteImage(boardId, item.itemId);
              break;
            case "embed":
              result = await deleteEmbed(boardId, item.itemId);
              break;
            case "connector":
              if (!item.connectorId) {
                throw new Error("connectorId is required for connector type");
              }
              result = await deleteConnector(boardId, item.connectorId);
              break;
            default:
              throw new Error(`Unsupported item type: ${item.type}`);
          }
          results.push({
            type: item.type,
            itemId: item.itemId,
            connectorId: item.connectorId,
            deleted: true
          });
        } catch (error) {
          errors.push({
            item: item,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const response = {
        success: true,
        message: `Deleted ${results.length} items successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        deletedItems: results,
        errors: errors.length > 0 ? errors : undefined
      };

      return ServerResponse.text(JSON.stringify(response, null, 2));
    } catch (error) {
      return ServerResponse.error(error);
    }
  }
};

export default deleteItemsInBulkTool;
