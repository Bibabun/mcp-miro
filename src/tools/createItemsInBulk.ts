import MiroClient from '../client.js';
import { z } from 'zod';
import { ServerResponse } from '../server-response.js';
import { ToolSchema } from '../tool.js';

import { StickyNoteCreateRequest } from '@mirohq/miro-api/dist/model/stickyNoteCreateRequest.js';
import { StickyNoteData } from '@mirohq/miro-api/dist/model/stickyNoteData.js';
import { CardCreateRequest } from '@mirohq/miro-api/dist/model/cardCreateRequest.js';
import { CardData } from '@mirohq/miro-api/dist/model/cardData.js';
import { TextCreateRequest } from '@mirohq/miro-api/dist/model/textCreateRequest.js';
import { TextData } from '@mirohq/miro-api/dist/model/textData.js';
import { ShapeCreateRequest } from '@mirohq/miro-api/dist/model/shapeCreateRequest.js';
import { ShapeData } from '@mirohq/miro-api/dist/model/shapeData.js';
import { FrameCreateRequest } from '@mirohq/miro-api/dist/model/frameCreateRequest.js';
import { FrameChanges } from '@mirohq/miro-api/dist/model/frameChanges.js';
import { AppCardCreateRequest } from '@mirohq/miro-api/dist/model/appCardCreateRequest.js';
import { AppCardData } from '@mirohq/miro-api/dist/model/appCardData.js';
import { DocumentCreateRequest } from '@mirohq/miro-api/dist/model/documentCreateRequest.js';
import { DocumentUrlData } from '@mirohq/miro-api/dist/model/documentUrlData.js';
import { ImageCreateRequest } from '@mirohq/miro-api/dist/model/imageCreateRequest.js';
import { ImageUrlData } from '@mirohq/miro-api/dist/model/imageUrlData.js';
import { EmbedCreateRequest } from '@mirohq/miro-api/dist/model/embedCreateRequest.js';
import { EmbedUrlData } from '@mirohq/miro-api/dist/model/embedUrlData.js';
import { ConnectorCreationData } from '@mirohq/miro-api/dist/model/connectorCreationData.js';

// Validation constants
const validStickyNoteColors = [
  'light_yellow', 'yellow', 'orange', 
  'light_green', 'green', 
  'light_blue', 'blue', 
  'light_pink', 'pink',
  'light_purple', 'purple',
  'black', 'gray', 'white'
];

const validStickyNoteShapes = ['square', 'rectangle'];
const validTextAligns = ['left', 'center', 'right'];
const validShapeTypes = ['rectangle', 'round_rectangle', 'circle', 'triangle', 'rhombus', 'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'octagon', 'wedge_round_rectangle_callout', 'star', 'flow_chart_predefined_process', 'cloud', 'cross', 'can', 'right_arrow', 'left_arrow', 'left_right_arrow', 'left_brace', 'right_brace'];

// Validation utility functions
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

function validateAndNormalizeColor(color: string | null | undefined, defaultColor: string = '#000000'): string {
  if (!color) return defaultColor;
  
  // If it's already a valid hex color, return it
  if (isValidHexColor(color)) return color;
  
  // Try to add # if missing
  if (/^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return `#${color}`;
  }
  
  // Return default if invalid
  return defaultColor;
}

function validateNumericRange(value: number | null | undefined, min: number, max: number, defaultValue: number): number {
  if (value === null || value === undefined) return defaultValue;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function validateOpacity(value: number | null | undefined): number {
  return validateNumericRange(value, 0, 1, 1);
}

function validateDimension(value: number | null | undefined, defaultValue: number = 100): number {
  return validateNumericRange(value, 1, 10000, defaultValue);
}

function validateBorderWidth(value: number | null | undefined): number {
  return validateNumericRange(value, 0, 100, 1);
}

// Enhanced Zod schemas with custom validators
const hexColorSchema = z.string().refine(
  (val) => !val || isValidHexColor(val) || /^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val),
  { message: "Invalid color format. Use hex format like #RRGGBB or #RGB" }
).transform(val => validateAndNormalizeColor(val));

const opacitySchema = z.number().min(0).max(1).optional().nullish();
const dimensionSchema = z.number().min(1).max(10000);
const borderWidthSchema = z.number().min(0).max(100).optional().nullish();

const stickyNoteSchema = z.object({
  type: z.literal('sticky_note'),
  data: z.object({
    content: z.string().describe("Text content of the sticky note"),
    shape: z.enum(['square', 'rectangle']).optional().nullish().describe("Shape of the sticky note")
  }),
  position: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate")
  }),
  style: z.object({
    fillColor: z.string().optional().nullish().describe("Fill color of the sticky note"),
    textAlign: z.enum(['left', 'center', 'right']).optional().nullish().describe("Text alignment")
  }).optional().nullish()
});

const cardSchema = z.object({
  type: z.literal('card'),
  data: z.object({
    title: z.string().describe("Title of the card"),
    description: z.string().optional().nullish().describe("Description of the card"),
    assigneeId: z.string().optional().nullish().describe("User ID of the assignee"),
    dueDate: z.string().optional().nullish().describe("Due date in ISO 8601 format")
  }),
  position: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate")
  }),
  style: z.object({
    fillColor: z.string().optional().nullish().describe("Fill color"),
    textColor: z.string().optional().nullish().describe("Text color")
  }).optional().nullish()
});

const textSchema = z.object({
  type: z.literal('text'),
  data: z.object({
    content: z.string().describe("Text content")
  }),
  position: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate")
  }),
  style: z.object({
    color: z.string().optional().nullish().describe("Text color (hex format, e.g. #000000)"),
    fontSize: z.number().min(1).max(288).optional().nullish().describe("Font size"),
    textAlign: z.enum(['left', 'center', 'right']).optional().nullish().describe("Text alignment")
  }).optional().nullish()
});

const shapeSchema = z.object({
  type: z.literal('shape'),
  data: z.object({
    shapeType: z.string().describe("Type of the shape (rectangle, circle, triangle, etc.)"),
    content: z.string().optional().nullish().describe("Text content to display inside the shape")
  }),
  position: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate")
  }),
  geometry: z.object({
    width: dimensionSchema.describe("Width of the shape"),
    height: dimensionSchema.describe("Height of the shape"),
    rotation: z.number().min(-360).max(360).optional().nullish().describe("Rotation angle of the shape")
  }),
  style: z.object({
    borderColor: z.string().optional().nullish().describe("Color of the shape border (hex format)"),
    borderWidth: borderWidthSchema.describe("Width of the shape border"),
    borderStyle: z.string().optional().nullish().describe("Style of the shape border"),
    borderOpacity: opacitySchema.describe("Opacity of the shape border (0-1)"),
    fillColor: z.string().optional().nullish().describe("Fill color of the shape (hex format)"),
    fillOpacity: opacitySchema.describe("Opacity of the shape fill (0-1)"),
    color: z.string().optional().nullish().describe("Color of the text in the shape (hex format)")
  }).optional().nullish()
});

const frameSchema = z.object({
  type: z.literal('frame'),
  data: z.object({
    title: z.string().optional().nullish().describe("Title of the frame"),
    format: z.string().optional().nullish().describe("Format of the frame"),
    frameType: z.string().optional().nullish().describe("Type of the frame"),
    showContent: z.boolean().optional().nullish().describe("Hide or reveal the content inside a frame")
  }),
  position: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate")
  }),
  geometry: z.object({
    width: dimensionSchema.optional().nullish().describe("Width of the frame"),
    height: dimensionSchema.optional().nullish().describe("Height of the frame")
  }).optional().nullish(),
  style: z.object({
    fillColor: z.string().optional().nullish().describe("Fill color for the frame")
  }).optional().nullish()
});

const appCardSchema = z.object({
  type: z.literal('app_card'),
  data: z.object({
    title: z.string().describe("Title of the app card"),
    description: z.string().optional().nullish().describe("Description of the app card"),
    status: z.string().optional().nullish().describe("Status text of the app card"),
    fields: z.array(z.object({
      value: z.string().describe("Value of the field"),
      iconShape: z.string().optional().nullish().describe("Shape of the icon"),
      fillColor: z.string().optional().nullish().describe("Fill color of the field"),
      textColor: z.string().optional().nullish().describe("Color of the text")
    })).optional().nullish().describe("Custom fields to display on the app card")
  }),
  position: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate")
  }),
  geometry: z.object({
    width: dimensionSchema.optional().nullish().describe("Width of the app card"),
    height: dimensionSchema.optional().nullish().describe("Height of the app card")
  }).optional().nullish()
});

const documentSchema = z.object({
  type: z.literal('document'),
  data: z.object({
    url: z.string().url().describe("URL of the document to be added to the board"),
    title: z.string().optional().nullish().describe("Title of the document")
  }),
  position: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate")
  }),
  geometry: z.object({
    width: dimensionSchema.optional().nullish().describe("Width of the document"),
    height: dimensionSchema.optional().nullish().describe("Height of the document")
  }).optional().nullish()
});

const imageSchema = z.object({
  type: z.literal('image'),
  data: z.object({
    url: z.string().url().describe("URL of the image to be added to the board"),
    title: z.string().optional().nullish().describe("Title of the image")
  }),
  position: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate"),
    origin: z.string().optional().nullish().describe("Origin of the image"),
    relativeTo: z.string().optional().nullish().describe("Reference point")
  }),
  geometry: z.object({
    width: dimensionSchema.optional().nullish().describe("Width of the image"),
    height: dimensionSchema.optional().nullish().describe("Height of the image")
  }).optional().nullish()
});

const embedSchema = z.object({
  type: z.literal('embed'),
  data: z.object({
    url: z.string().url().describe("URL to be embedded on the board"),
    mode: z.string().optional().nullish().describe("Mode of the embed")
  }),
  position: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate"),
    origin: z.string().optional().nullish().describe("Origin of the embed"),
    relativeTo: z.string().optional().nullish().describe("Reference point")
  }),
  geometry: z.object({
    width: dimensionSchema.optional().nullish().describe("Width of the embed"),
    height: dimensionSchema.optional().nullish().describe("Height of the embed")
  })
});

const connectorSchema = z.object({
  type: z.literal('connector'),
  startItem: z.object({
    id: z.string().describe("ID of the item at the start of the connector")
  }),
  endItem: z.object({
    id: z.string().describe("ID of the item at the end of the connector")
  }),
  style: z.object({
    strokeColor: z.string().optional().nullish().describe("Color of the connector stroke"),
    strokeWidth: z.number().min(1).max(24).optional().nullish().describe("Width of the connector stroke"),
    strokeStyle: z.string().optional().nullish().describe("Style of the connector stroke"),
    startStrokeCap: z.string().optional().nullish().describe("Start stroke cap style"),
    endStrokeCap: z.string().optional().nullish().describe("End stroke cap style")
  }).optional().nullish()
});

const itemSchema = z.discriminatedUnion('type', [
  stickyNoteSchema,
  cardSchema,
  textSchema,
  shapeSchema,
  frameSchema,
  appCardSchema,
  documentSchema,
  imageSchema,
  embedSchema,
  connectorSchema
]);

// Validation error class
class ValidationError extends Error {
  constructor(public field: string, public value: any, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const createItemsInBulkTool: ToolSchema = {
  name: "create-items-in-bulk",
  description: "Create multiple items on a Miro board in a single operation",
  args: {
    boardId: z.string().describe("Unique identifier (ID) of the board where the items will be created"),
    items: z.array(itemSchema).describe("Array of items to create")
  },
  fn: async ({ boardId, items }) => {
    try {
      if (!boardId) {
        return ServerResponse.error("Board ID is required");
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return ServerResponse.error("At least one item is required");
      }

      const results = [];
      const errors = [];
      const validationErrors = [];

      // Pre-validate all items
      for (let i = 0; i < items.length; i++) {
        try {
          const item = items[i];
          
          // Type-specific validation
          if (item.type === 'shape' && !validShapeTypes.includes(item.data.shapeType)) {
            validationErrors.push({
              index: i,
              field: 'data.shapeType',
              value: item.data.shapeType,
              error: `Invalid shape type. Valid types are: ${validShapeTypes.join(", ")}`
            });
          }
          
          // Validate colors if present
          if (item.style) {
            const style = item.style as any;
            if (style.fillColor && !isValidHexColor(style.fillColor)) {
              validationErrors.push({
                index: i,
                field: 'style.fillColor',
                value: style.fillColor,
                error: `Invalid fill color format. Use hex format like #RRGGBB`
              });
            }
            if (style.borderColor && !isValidHexColor(style.borderColor)) {
              validationErrors.push({
                index: i,
                field: 'style.borderColor',
                value: style.borderColor,
                error: `Invalid border color format. Use hex format like #RRGGBB`
              });
            }
            if (style.color && !isValidHexColor(style.color)) {
              validationErrors.push({
                index: i,
                field: 'style.color',
                value: style.color,
                error: `Invalid text color format. Use hex format like #RRGGBB`
              });
            }
            if (style.textColor && !isValidHexColor(style.textColor)) {
              validationErrors.push({
                index: i,
                field: 'style.textColor',
                value: style.textColor,
                error: `Invalid text color format. Use hex format like #RRGGBB`
              });
            }
          }
        } catch (validationError) {
          validationErrors.push({
            index: i,
            error: `Validation failed: ${validationError.message}`
          });
        }
      }

      // If there are validation errors, return them immediately
      if (validationErrors.length > 0) {
        return ServerResponse.text(JSON.stringify({
          created: 0,
          failed: validationErrors.length,
          results: [],
          validationErrors,
          message: "Items failed validation. Please fix the errors and try again."
        }, null, 2));
      }

      const createPromises = items.map(async (item, index) => {
        try {
          let result;
          
          if (item.type === 'sticky_note') {
            result = await createStickyNote(boardId, item);
          } else if (item.type === 'card') {
            result = await createCard(boardId, item);
          } else if (item.type === 'text') {
            result = await createText(boardId, item);
          } else if (item.type === 'shape') {
            result = await createShape(boardId, item);
          } else if (item.type === 'frame') {
            result = await createFrame(boardId, item);
          } else if (item.type === 'app_card') {
            result = await createAppCard(boardId, item);
          } else if (item.type === 'document') {
            result = await createDocument(boardId, item);
          } else if (item.type === 'image') {
            result = await createImage(boardId, item);
          } else if (item.type === 'embed') {
            result = await createEmbed(boardId, item);
          } else if (item.type === 'connector') {
            result = await createConnector(boardId, item);
          }
          
          return { index, result };
        } catch (error) {
          // Enhanced error reporting
          let errorMessage = error.message || String(error);
          
          // Try to extract more specific error information
          if (error.response) {
            if (error.response.data) {
              errorMessage = JSON.stringify(error.response.data);
            } else if (error.response.statusText) {
              errorMessage = `${error.response.status}: ${error.response.statusText}`;
            }
          }
          
          return { 
            index, 
            error: errorMessage,
            itemType: item.type,
            itemData: item
          };
        }
      });
      
      const promiseResults = await Promise.all(createPromises);
      
      for (const promiseResult of promiseResults) {
        const { index, result, error, itemType, itemData } = promiseResult;
        if (error) {
          errors.push({ 
            index, 
            error,
            itemType,
            hint: getErrorHint(error, itemType, itemData)
          });
        } else if (result) {
          results.push({ index, item: result });
        }
      }
      
      return ServerResponse.text(JSON.stringify({
        created: results.length,
        failed: errors.length,
        results,
        errors,
        summary: `Successfully created ${results.length} items, ${errors.length} failed`
      }, null, 2));
      
    } catch (error) {
      return ServerResponse.error(error);
    }
  }
}

// Helper function to provide error hints
function getErrorHint(error: string, itemType: string, itemData: any): string {
  if (error.includes('400') || error.includes('Bad Request')) {
    if (itemType === 'shape') {
      return `Check shape type is valid: ${validShapeTypes.join(', ')}`;
    }
    if (itemType === 'sticky_note') {
      return `Check color is valid: ${validStickyNoteColors.join(', ')}`;
    }
    return 'Check that all required fields are provided and valid';
  }
  if (error.includes('401') || error.includes('Unauthorized')) {
    return 'Check API authentication/token';
  }
  if (error.includes('403') || error.includes('Forbidden')) {
    return 'Check board permissions';
  }
  if (error.includes('404') || error.includes('Not Found')) {
    return 'Check board ID is correct';
  }
  if (error.includes('429') || error.includes('Too Many Requests')) {
    return 'Rate limit exceeded. Try smaller batches or add delays';
  }
  return '';
}

async function createStickyNote(boardId: string, item: z.infer<typeof stickyNoteSchema>) {
  const createRequest = new StickyNoteCreateRequest();
  
  const stickyNoteData = new StickyNoteData();
  stickyNoteData.content = item.data.content;
  stickyNoteData.shape = item.data.shape || 'square';
  
  createRequest.data = stickyNoteData;
  createRequest.position = item.position;
  
  if (item.style) {
    const style: Record<string, string> = {};
    
    if (item.style.fillColor) {
      // Validate sticky note color
      if (validStickyNoteColors.includes(item.style.fillColor)) {
        style.fillColor = item.style.fillColor;
      } else {
        // Try to use a default if invalid
        style.fillColor = 'light_yellow';
      }
    }
    
    if (item.style.textAlign) {
      style.textAlign = item.style.textAlign;
    }
    
    createRequest.style = style;
  }
  
  return await MiroClient.getApi().createStickyNoteItem(boardId, createRequest);
}

async function createCard(boardId: string, item: z.infer<typeof cardSchema>) {
  const createRequest = new CardCreateRequest();
  
  const cardData = new CardData();
  cardData.title = item.data.title;
  
  if (item.data.description) {
    cardData.description = item.data.description;
  }
  
  if (item.data.assigneeId) {
    cardData.assigneeId = item.data.assigneeId;
  }
  
  if (item.data.dueDate) {
    try {
      cardData.dueDate = new Date(item.data.dueDate);
    } catch (e) {
      // Skip invalid date
    }
  }
  
  createRequest.data = cardData;
  createRequest.position = item.position;
  
  if (item.style) {
    const style: Record<string, any> = {};
    if (item.style.fillColor) {
      style.fillColor = validateAndNormalizeColor(item.style.fillColor);
    }
    if (item.style.textColor) {
      style.textColor = validateAndNormalizeColor(item.style.textColor);
    }
    createRequest.style = style;
  }
  
  return await MiroClient.getApi().createCardItem(boardId, createRequest);
}

async function createText(boardId: string, item: z.infer<typeof textSchema>) {
  const createRequest = new TextCreateRequest();
  
  const textData = new TextData();
  textData.content = item.data.content;
  
  createRequest.data = textData;
  createRequest.position = item.position;
  
  if (item.style) {
    const style: Record<string, any> = {};
    if (item.style.color) {
      style.color = validateAndNormalizeColor(item.style.color);
    }
    if (item.style.fontSize) {
      style.fontSize = validateNumericRange(item.style.fontSize, 1, 288, 14);
    }
    if (item.style.textAlign) {
      style.textAlign = item.style.textAlign;
    }
    createRequest.style = style;
  }
  
  return await MiroClient.getApi().createTextItem(boardId, createRequest);
}

async function createShape(boardId: string, item: z.infer<typeof shapeSchema>) {
  if (!validShapeTypes.includes(item.data.shapeType)) {
    throw new ValidationError('data.shapeType', item.data.shapeType, 
      `Invalid shape type. Valid types are: ${validShapeTypes.join(", ")}`);
  }

  const createRequest = new ShapeCreateRequest();
  
  const shapeData = new ShapeData();
  (shapeData as any).type = item.data.shapeType;
  
  if (item.data.content !== undefined && item.data.content !== null) {
    shapeData.content = item.data.content;
  }
  
  createRequest.data = shapeData;
  
  const completePosition = {
    ...item.position,
    origin: "center",
    relativeTo: "canvas_center"
  };
  
  createRequest.position = completePosition;
  
  // Validate geometry
  createRequest.geometry = {
    width: validateDimension(item.geometry.width),
    height: validateDimension(item.geometry.height)
  };
  
  if (item.geometry.rotation !== undefined && item.geometry.rotation !== null) {
    createRequest.geometry.rotation = validateNumericRange(item.geometry.rotation, -360, 360, 0);
  }
  
  if (item.style) {
    const style: Record<string, any> = {};
    
    if (item.style.borderColor) {
      style.borderColor = validateAndNormalizeColor(item.style.borderColor);
    }
    if (item.style.borderWidth !== undefined && item.style.borderWidth !== null) {
      style.borderWidth = validateBorderWidth(item.style.borderWidth);
    }
    if (item.style.borderStyle) {
      style.borderStyle = item.style.borderStyle;
    }
    if (item.style.borderOpacity !== undefined && item.style.borderOpacity !== null) {
      style.borderOpacity = validateOpacity(item.style.borderOpacity);
    }
    if (item.style.fillColor) {
      style.fillColor = validateAndNormalizeColor(item.style.fillColor);
    }
    if (item.style.fillOpacity !== undefined && item.style.fillOpacity !== null) {
      style.fillOpacity = validateOpacity(item.style.fillOpacity);
    }
    if (item.style.color) {
      style.color = validateAndNormalizeColor(item.style.color);
    }
    
    createRequest.style = style;
  }

  return await MiroClient.getApi().createShapeItem(boardId, createRequest);
}

async function createFrame(boardId: string, item: z.infer<typeof frameSchema>) {
  const createRequest = new FrameCreateRequest();
  
  const frameData = new FrameChanges();
  
  if (item.data.title !== undefined) frameData.title = item.data.title;
  if (item.data.format !== undefined) frameData.format = item.data.format;
  if (item.data.frameType !== undefined) frameData.type = item.data.frameType;
  if (item.data.showContent !== undefined) frameData.showContent = item.data.showContent;
  
  createRequest.data = frameData;
  createRequest.position = item.position;
  
  if (item.geometry) {
    const geometry: Record<string, any> = {};
    if (item.geometry.width !== undefined && item.geometry.width !== null) {
      geometry.width = validateDimension(item.geometry.width);
    }
    if (item.geometry.height !== undefined && item.geometry.height !== null) {
      geometry.height = validateDimension(item.geometry.height);
    }
    createRequest.geometry = geometry;
  }
  
  if (item.style) {
    const style: Record<string, any> = {};
    if (item.style.fillColor) {
      style.fillColor = validateAndNormalizeColor(item.style.fillColor);
    }
    createRequest.style = style;
  }

  return await MiroClient.getApi().createFrameItem(boardId, createRequest);
}

async function createAppCard(boardId: string, item: z.infer<typeof appCardSchema>) {
  const createRequest = new AppCardCreateRequest();
  
  const appCardData = new AppCardData();
  appCardData.title = item.data.title;
  
  if (item.data.description) {
    appCardData.description = item.data.description;
  }
  
  if (item.data.status) {
    appCardData.status = item.data.status;
  }
  
  if (item.data.fields) {
    // Validate field colors
    appCardData.fields = item.data.fields.map(field => ({
      ...field,
      fillColor: field.fillColor ? validateAndNormalizeColor(field.fillColor) : undefined,
      textColor: field.textColor ? validateAndNormalizeColor(field.textColor) : undefined
    }));
  }
  
  createRequest.data = appCardData;
  createRequest.position = item.position;
  
  if (item.geometry) {
    const geometry: Record<string, any> = {};
    if (item.geometry.width !== undefined && item.geometry.width !== null) {
      geometry.width = validateDimension(item.geometry.width);
    }
    if (item.geometry.height !== undefined && item.geometry.height !== null) {
      geometry.height = validateDimension(item.geometry.height);
    }
    createRequest.geometry = geometry;
  }

  return await MiroClient.getApi().createAppCardItem(boardId, createRequest);
}

async function createDocument(boardId: string, item: z.infer<typeof documentSchema>) {
  const createRequest = new DocumentCreateRequest();
  
  const documentData = new DocumentUrlData();
  documentData.url = item.data.url;
  
  if (item.data.title) {
    documentData.title = item.data.title;
  }
  
  createRequest.data = documentData;
  createRequest.position = item.position;
  
  if (item.geometry) {
    const geometry: Record<string, any> = {};
    if (item.geometry.width !== undefined && item.geometry.width !== null) {
      geometry.width = validateDimension(item.geometry.width);
    }
    if (item.geometry.height !== undefined && item.geometry.height !== null) {
      geometry.height = validateDimension(item.geometry.height);
    }
    createRequest.geometry = geometry;
  }

  return await MiroClient.getApi().createDocumentItemUsingUrl(boardId, createRequest);
}

async function createImage(boardId: string, item: z.infer<typeof imageSchema>) {
  const createRequest = new ImageCreateRequest();
  
  const imageData = new ImageUrlData();
  imageData.url = item.data.url;
  
  if (item.data.title) {
    imageData.title = item.data.title;
  }
  
  createRequest.data = imageData;
  
  const completePosition = {
    x: item.position.x,
    y: item.position.y,
    origin: item.position.origin || "center",
    relativeTo: item.position.relativeTo || "canvas_center"
  };
  
  createRequest.position = completePosition;
  
  if (item.geometry) {
    const geometry: Record<string, any> = {};
    if (item.geometry.width !== undefined && item.geometry.width !== null) {
      geometry.width = validateDimension(item.geometry.width);
    }
    if (item.geometry.height !== undefined && item.geometry.height !== null) {
      geometry.height = validateDimension(item.geometry.height);
    }
    createRequest.geometry = geometry;
  }

  return await MiroClient.getApi().createImageItemUsingUrl(boardId, createRequest);
}

async function createEmbed(boardId: string, item: z.infer<typeof embedSchema>) {
  const createRequest = new EmbedCreateRequest();
  
  const embedData = new EmbedUrlData();
  embedData.url = item.data.url;
  
  if (item.data.mode) {
    embedData.mode = item.data.mode;
  }
  
  createRequest.data = embedData;
  
  const completePosition = {
    x: item.position.x,
    y: item.position.y,
    origin: item.position.origin || "center",
    relativeTo: item.position.relativeTo || "canvas_center"
  };
  
  createRequest.position = completePosition;
  
  const geometry: Record<string, any> = {};
  if (item.geometry.width !== undefined && item.geometry.width !== null) {
    geometry.width = validateDimension(item.geometry.width);
  }
  if (item.geometry.height !== undefined && item.geometry.height !== null) {
    geometry.height = validateDimension(item.geometry.height);
  }
  createRequest.geometry = geometry;

  return await MiroClient.getApi().createEmbedItem(boardId, createRequest);
}

async function createConnector(boardId: string, item: z.infer<typeof connectorSchema>) {
  const connectorData = new ConnectorCreationData();
  connectorData.startItem = item.startItem;
  connectorData.endItem = item.endItem;
  
  if (item.style) {
    const style: Record<string, any> = {};
    if (item.style.strokeColor) {
      style.strokeColor = validateAndNormalizeColor(item.style.strokeColor);
    }
    if (item.style.strokeWidth !== undefined && item.style.strokeWidth !== null) {
      style.strokeWidth = validateNumericRange(item.style.strokeWidth, 1, 24, 2);
    }
    if (item.style.strokeStyle) {
      style.strokeStyle = item.style.strokeStyle;
    }
    if (item.style.startStrokeCap) {
      style.startStrokeCap = item.style.startStrokeCap;
    }
    if (item.style.endStrokeCap) {
      style.endStrokeCap = item.style.endStrokeCap;
    }
    connectorData.style = style as any;
  }

  return await MiroClient.getApi().createConnector(boardId, connectorData);
}

export default createItemsInBulkTool;
