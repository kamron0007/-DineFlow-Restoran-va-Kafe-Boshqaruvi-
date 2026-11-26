import express, { type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  INITIAL_CATEGORIES,
  INITIAL_DISH_REVIEWS,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_TABLES,
} from './src/services/seedData.ts';
import type {
  Category,
  CustomerFeedback,
  DishReview,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  ServiceCall,
} from './src/types/index.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

function getLocalNetworkIp(): string | null {
  const interfaces = os.networkInterfaces();
  let fallbackIp: string | null = null;
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;
    for (const iface of ifaceList) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
        if (
          iface.address.startsWith('192.168.') ||
          iface.address.startsWith('10.') ||
          iface.address.startsWith('172.')
        ) {
          return iface.address;
        }
        if (!fallbackIp) fallbackIp = iface.address;
      }
    }
  }
  return fallbackIp;
}

// Persistent JSON Database File (data/db.json)
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface PersistentDatabase {
  categories: Category[];
  menu_items: MenuItem[];
  orders: Order[];
  service_calls: ServiceCall[];
  dish_reviews: DishReview[];
  feedbacks: CustomerFeedback[];
  updated_at: string;
}

function loadDatabase(): PersistentDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<PersistentDatabase>;
      if (
        Array.isArray(parsed.categories) &&
        Array.isArray(parsed.menu_items) &&
        Array.isArray(parsed.orders)
      ) {
        return {
          categories: parsed.categories,
          menu_items: parsed.menu_items,
          orders: parsed.orders,
          service_calls: Array.isArray(parsed.service_calls) ? parsed.service_calls : [],
          dish_reviews:
            Array.isArray(parsed.dish_reviews) && parsed.dish_reviews.length > 0
              ? parsed.dish_reviews
              : [...INITIAL_DISH_REVIEWS],
          feedbacks: Array.isArray(parsed.feedbacks) ? parsed.feedbacks : [],
          updated_at: parsed.updated_at || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('db.json yuklashda xatolik, boshlang\'ich ma\'lumotlar yozilmoqda:', err);
  }

  const initialDb: PersistentDatabase = {
    categories: [...INITIAL_CATEGORIES],
    menu_items: [...INITIAL_MENU_ITEMS],
    orders: [...INITIAL_ORDERS],
    service_calls: [],
    dish_reviews: [...INITIAL_DISH_REVIEWS],
    feedbacks: [],
    updated_at: new Date().toISOString(),
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: PersistentDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.updated_at = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('db.json saqlashda xatolik:', err);
  }
}

const dbState = loadDatabase();

// Optional Supabase Server Client (if VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY exist)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const hasSupabase = Boolean(
  supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id')
);
const supabase = hasSupabase ? createClient(supabaseUrl, supabaseKey) : null;

// OpenAPI 3.0.3 JSON Definition
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'DineFlow Restaurant REST API',
    version: '1.1.0',
    description:
      "DineFlow — Restoran boshqaruv tizimi uchun Menyu, Kategoriyalar va Buyurtmalar REST API (Doimiy data/db.json + Supabase Gibrid Backend).",
  },
  servers: [{ url: `http://localhost:${PORT}`, description: 'DineFlow REST Server' }],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: "Server, JSON fayl bazasi va Supabase holatini tekshirish",
        responses: { '200': { description: 'Server faol holatda' } },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Menu'],
        summary: 'Barcha menyu kategoriyalarini olish',
        responses: { '200': { description: "Kategoriyalar ro'yxati" } },
      },
      post: {
        tags: ['Menu'],
        summary: "Yangi menyu kategoriyasi qo'shish yoki yangilash",
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  id: { type: 'string', example: 'cat-custom' },
                  name: { type: 'string', example: 'Milliy shirinliklar' },
                  icon: { type: 'string', example: 'Cake' },
                  sort_order: { type: 'integer', example: 7 },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Kategoriya saqlandi' } },
      },
    },
    '/api/categories/{id}': {
      delete: {
        tags: ['Menu'],
        summary: "Kategoriyani o'chirish",
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: "Kategoriya o'chirildi" } },
      },
    },
    '/api/menu': {
      get: {
        tags: ['Menu'],
        summary: "Taomlar ro'yxatini olish (filtrlar bilan)",
        parameters: [
          { name: 'category_id', in: 'query', schema: { type: 'string' }, description: 'Kategoriya ID (masalan: cat-milliy)' },
          { name: 'tier', in: 'query', schema: { type: 'string', enum: ['oddiy', 'biznes', 'vip'] } },
          { name: 'available', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { '200': { description: "Taomlar ro'yxati" } },
      },
      post: {
        tags: ['Menu'],
        summary: "Menyuga yangi taom qo'shish (data/db.json va Supabase ga saqlanadi)",
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['category_id', 'name', 'price'],
                properties: {
                  category_id: { type: 'string', example: 'cat-milliy' },
                  name: { type: 'string', example: 'Samarqand Zigir Oshi' },
                  description: { type: 'string', example: 'Zigir yog\'ida damlangan an\'anaviy osh' },
                  price: { type: 'number', example: 55000 },
                  preparation_time_minutes: { type: 'integer', example: 20 },
                  tier: { type: 'string', enum: ['oddiy', 'biznes', 'vip'], example: 'vip' },
                  is_available: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Taom yaratildi va db.json ga yozildi' } },
      },
    },
    '/api/menu/{id}': {
      get: {
        tags: ['Menu'],
        summary: "ID bo'yicha bitta taomni olish",
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Taom topildi' }, '404': { description: 'Topilmadi' } },
      },
      put: {
        tags: ['Menu'],
        summary: 'Taomni tahrirlash (narxi, mavjudligi, nomi)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  is_available: { type: 'boolean' },
                  tier: { type: 'string', enum: ['oddiy', 'biznes', 'vip'] },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Yangilandi' } },
      },
      delete: {
        tags: ['Menu'],
        summary: "Taomni o'chirish",
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: "O'chirildi" } },
      },
    },
    '/api/orders': {
      get: {
        tags: ['Orders'],
        summary: "Barcha buyurtmalar ro'yxatini olish",
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['new', 'preparing', 'ready', 'delivered', 'cancelled'] },
          },
          { name: 'table_number', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: "Buyurtmalar ro'yxati" } },
      },
      post: {
        tags: ['Orders'],
        summary: 'Yangi buyurtma yaratish (data/db.json va Supabase ga saqlanadi)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['table_number', 'items'],
                properties: {
                  table_number: { type: 'integer', example: 5 },
                  customer_note: { type: 'string', example: "Ko'k choy limon bilan" },
                  waiter_name: { type: 'string', example: 'Karimov Dilshod' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['menu_item_id', 'quantity'],
                      properties: {
                        menu_item_id: { type: 'string', example: 'dish-1' },
                        quantity: { type: 'integer', example: 2 },
                        item_note: { type: 'string', example: 'Piyozsiz' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Buyurtma yaratildi va saqlandi' } },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Bitta buyurtma tafsilotini olish',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Buyurtma topildi' }, '404': { description: 'Topilmadi' } },
      },
    },
    '/api/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: "Buyurtma holatini o'zgartirish (new -> preparing -> ready -> delivered)",
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['new', 'preparing', 'ready', 'delivered', 'cancelled'],
                    example: 'preparing',
                  },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Holat yangilandi va saqlandi' } },
      },
    },
  },
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      mode: supabase ? 'json+supabase' : 'json_file',
      db_file: 'data/db.json',
      categories_count: dbState.categories.length,
      menu_items_count: dbState.menu_items.length,
      orders_count: dbState.orders.length,
      updated_at: dbState.updated_at,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. OpenAPI JSON & YAML + Swagger UI (/api/docs)
  app.get('/api/openapi.json', (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  app.get('/api/openapi.yaml', (_req: Request, res: Response) => {
    const yamlPath = path.resolve(process.cwd(), 'openapi.yaml');
    if (fs.existsSync(yamlPath)) {
      res.type('text/yaml').send(fs.readFileSync(yamlPath, 'utf-8'));
    } else {
      res.status(404).json({ error: 'openapi.yaml topilmadi' });
    }
  });

  app.get('/api/docs', (_req: Request, res: Response) => {
    res.type('html').send(`<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8" />
  <title>DineFlow REST API — OpenAPI / Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
</head>
<body style="margin:0;background:#FAF8F3;">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
      });
    };
  </script>
</body>
</html>`);
  });

  // 3. Categories CRUD
  app.get('/api/categories', async (_req: Request, res: Response) => {
    if (supabase) {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order');
      if (!error && data && data.length > 0) {
        return res.json(data);
      }
    }
    res.json(dbState.categories);
  });

  app.post('/api/categories', async (req: Request, res: Response) => {
    const { id, name, icon, image_url, sort_order } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: 'Kategoriya nomi (name) kiritilishi shart' });
    }
    const categoryId = id || `cat-${Date.now()}`;
    const newCat: Category = {
      id: String(categoryId),
      name: String(name).trim(),
      icon: icon ? String(icon) : 'Utensils',
      image_url: image_url ? String(image_url) : undefined,
      sort_order: sort_order !== undefined ? Number(sort_order) : dbState.categories.length + 1,
      created_at: new Date().toISOString(),
    };

    const existingIdx = dbState.categories.findIndex((c) => c.id === newCat.id);
    if (existingIdx >= 0) {
      dbState.categories[existingIdx] = newCat;
    } else {
      dbState.categories.push(newCat);
    }
    saveDatabase(dbState);

    if (supabase) {
      try {
        await supabase.from('categories').upsert(newCat);
      } catch {
        // Ignore cloud sync error
      }
    }
    res.status(201).json(newCat);
  });

  app.delete('/api/categories/:id', async (req: Request, res: Response) => {
    dbState.categories = dbState.categories.filter((c) => c.id !== req.params.id);
    saveDatabase(dbState);
    if (supabase) {
      try {
        await supabase.from('categories').delete().eq('id', req.params.id);
      } catch {
        // Ignore cloud sync error
      }
    }
    res.json({ success: true, deleted_id: req.params.id });
  });

  // 4. Menu Items CRUD
  app.get('/api/menu', async (req: Request, res: Response) => {
    const { category_id, tier, available } = req.query;
    let list = [...dbState.menu_items];

    if (supabase) {
      const { data, error } = await supabase.from('menu_items').select('*');
      if (!error && data && data.length > 0) {
        list = data as MenuItem[];
      }
    }

    if (category_id && category_id !== 'cat-all') {
      list = list.filter((m) => m.category_id === String(category_id));
    }
    if (tier && tier !== 'all') {
      list = list.filter((m) => m.tier === String(tier));
    }
    if (available !== undefined) {
      const isAvail = String(available) === 'true';
      list = list.filter((m) => m.is_available === isAvail);
    }

    res.json(list);
  });

  app.get('/api/menu/:id', (req: Request, res: Response) => {
    const item = dbState.menu_items.find((m) => m.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Taom topilmadi' });
    }
    res.json(item);
  });

  app.post('/api/menu', async (req: Request, res: Response) => {
    const {
      id,
      category_id,
      name,
      description,
      price,
      image_url,
      is_available,
      preparation_time_minutes,
      calories,
      weight_or_portion,
      tags,
      tier,
    } = req.body || {};

    if (!category_id || !name || price === undefined) {
      return res.status(400).json({ error: 'category_id, name va price kiritilishi shart' });
    }

    const now = new Date().toISOString();
    const newItem: MenuItem = {
      id: id ? String(id) : `dish-${Date.now()}`,
      category_id: String(category_id),
      name: String(name).trim(),
      description: description ? String(description).trim() : '',
      price: Number(price),
      image_url: image_url || '/images/dishes/dish-1.jpg',
      is_available: is_available !== undefined ? Boolean(is_available) : true,
      preparation_time_minutes: preparation_time_minutes ? Number(preparation_time_minutes) : 15,
      calories: calories ? Number(calories) : undefined,
      weight_or_portion: weight_or_portion ? String(weight_or_portion) : undefined,
      tags: Array.isArray(tags) ? tags : undefined,
      tier: tier || 'oddiy',
      created_at: now,
      updated_at: now,
    };

    const existingIdx = dbState.menu_items.findIndex((m) => m.id === newItem.id);
    if (existingIdx >= 0) {
      dbState.menu_items[existingIdx] = newItem;
    } else {
      dbState.menu_items.unshift(newItem);
    }
    saveDatabase(dbState);

    if (supabase) {
      try {
        await supabase.from('menu_items').upsert([newItem]);
      } catch {
        // Ignore cloud sync error
      }
    }
    res.status(201).json(newItem);
  });

  app.put('/api/menu/:id', async (req: Request, res: Response) => {
    const idx = dbState.menu_items.findIndex((m) => m.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Taom topilmadi' });
    }

    const updated: MenuItem = {
      ...dbState.menu_items[idx],
      ...req.body,
      id: dbState.menu_items[idx].id,
      updated_at: new Date().toISOString(),
    };
    dbState.menu_items[idx] = updated;
    saveDatabase(dbState);

    if (supabase) {
      try {
        await supabase.from('menu_items').update(req.body).eq('id', req.params.id);
      } catch {
        // Ignore cloud sync error
      }
    }
    res.json(updated);
  });

  app.delete('/api/menu/:id', async (req: Request, res: Response) => {
    const exists = dbState.menu_items.some((m) => m.id === req.params.id);
    if (!exists) {
      return res.status(404).json({ error: 'Taom topilmadi' });
    }
    dbState.menu_items = dbState.menu_items.filter((m) => m.id !== req.params.id);
    saveDatabase(dbState);

    if (supabase) {
      try {
        await supabase.from('menu_items').delete().eq('id', req.params.id);
      } catch {
        // Ignore cloud sync error
      }
    }
    res.json({ success: true, deleted_id: req.params.id });
  });

  // 5. Orders CRUD
  app.get('/api/orders', (req: Request, res: Response) => {
    const { status, table_number } = req.query;
    let list = [...dbState.orders];

    if (status && status !== 'all') {
      list = list.filter((o) => o.status === String(status));
    }
    if (table_number !== undefined) {
      list = list.filter((o) => o.table_number === Number(table_number));
    }
    res.json(list);
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = dbState.orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Buyurtma topilmadi' });
    }
    res.json(order);
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    const { id, order_number, table_id, table_number, customer_note, waiter_name, items } =
      req.body || {};

    if (!table_number || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "table_number va kamida 1 ta taom (items) bo'lishi shart" });
    }

    const orderId = id ? String(id) : `ord-${Date.now()}`;
    const orderNumber =
      order_number || `#DF-${Math.floor(1000 + Math.random() * 9000)}`;
    const matchedTable = INITIAL_TABLES.find((t) => t.table_number === Number(table_number));

    const builtItems: OrderItem[] = items.map((raw: any, i: number) => {
      const dish = dbState.menu_items.find((m) => m.id === raw.menu_item_id);
      const unitPrice = raw.unit_price ?? dish?.price ?? 0;
      const qty = Math.max(1, Number(raw.quantity) || 1);
      return {
        id: raw.id || `item-${Date.now()}-${i}`,
        order_id: orderId,
        menu_item_id: String(raw.menu_item_id),
        item_name: raw.item_name || dish?.name || 'Taom',
        unit_price: unitPrice,
        quantity: qty,
        item_note: raw.item_note ? String(raw.item_note) : undefined,
        line_total: unitPrice * qty,
      };
    });

    const totalAmount = builtItems.reduce((sum, it) => sum + it.line_total, 0);
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      table_id: table_id || matchedTable?.id || `tbl-${table_number}`,
      table_number: Number(table_number),
      status: 'new',
      total_amount: totalAmount,
      customer_note: customer_note ? String(customer_note) : undefined,
      waiter_name: waiter_name || matchedTable?.assigned_waiter_name || "Mas'ul ofitsiant",
      items: builtItems,
      created_at: now,
      updated_at: now,
    };

    dbState.orders.unshift(newOrder);
    saveDatabase(dbState);

    if (supabase) {
      try {
        await supabase.from('orders').insert({
          id: newOrder.id,
          order_number: newOrder.order_number,
          table_id: newOrder.table_id,
          status: newOrder.status,
          total_amount: newOrder.total_amount,
          customer_note: newOrder.customer_note,
        });
      } catch {
        // Ignore cloud sync error
      }
    }

    res.status(201).json(newOrder);
  });

  app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
    const { status } = req.body || {};
    const validStatuses: OrderStatus[] = ['new', 'preparing', 'ready', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ error: `Noto'g'ri status. Ruxsat etilganlar: ${validStatuses.join(', ')}` });
    }

    const idx = dbState.orders.findIndex((o) => o.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Buyurtma topilmadi' });
    }

    dbState.orders[idx] = {
      ...dbState.orders[idx],
      status,
      updated_at: new Date().toISOString(),
    };
    saveDatabase(dbState);

    if (supabase) {
      try {
        await supabase
          .from('orders')
          .update({ status, updated_at: dbState.orders[idx].updated_at })
          .eq('id', req.params.id);
      } catch {
        // Ignore cloud sync error
      }
    }

    res.json(dbState.orders[idx]);
  });

  // 5a. Network Info (so local QR codes can use Wi-Fi LAN IP instead of localhost)
  app.get('/api/network-info', (_req: Request, res: Response) => {
    const lanIp = getLocalNetworkIp();
    res.json({
      lanIp,
      port: PORT,
      lanUrl: lanIp ? `http://${lanIp}:${PORT}` : null,
    });
  });

  // 5b. Service Calls (Waiter Call & Real-time Status)
  app.get('/api/service-calls', (_req: Request, res: Response) => {
    res.json(dbState.service_calls || []);
  });

  app.post('/api/service-calls', (req: Request, res: Response) => {
    const {
      id,
      table_id,
      table_number,
      type,
      note,
      call_count,
      escalated_to_admin,
      assigned_waiter_name,
    } = req.body || {};

    if (!table_number) {
      return res.status(400).json({ error: 'table_number kiritilishi shart' });
    }

    const tblNum = Number(table_number);
    const existingPending = (dbState.service_calls || []).find(
      (c) => c.table_number === tblNum && c.status === 'pending'
    );
    const otherPending = (dbState.service_calls || []).filter(
      (c) => !(c.table_number === tblNum && c.status === 'pending') && c.status === 'pending'
    );

    const computedCount =
      call_count !== undefined
        ? Number(call_count)
        : existingPending
        ? (existingPending.call_count || 1) + 1
        : 1;
    const isEscalated =
      escalated_to_admin !== undefined
        ? Boolean(escalated_to_admin)
        : computedCount >= 3;

    const now = new Date().toISOString();
    const newCall: ServiceCall = {
      id: id ? String(id) : `call-${Date.now()}`,
      table_id: table_id ? String(table_id) : `table-${tblNum}`,
      table_number: tblNum,
      type: type || 'waiter',
      note: note || 'Ofitsiant chaqirildi',
      created_at: existingPending ? existingPending.created_at : now,
      last_called_at: now,
      call_count: computedCount,
      escalated_to_admin: isEscalated,
      assigned_waiter_name: assigned_waiter_name || "Mas'ul ofitsiant",
      status: 'pending',
    };

    dbState.service_calls = [
      newCall,
      ...(dbState.service_calls || []).filter(
        (c) => !(c.table_number === tblNum && c.status === 'pending')
      ),
    ];
    saveDatabase(dbState);
    res.status(201).json(newCall);
  });

  app.patch('/api/service-calls/:id/resolve', (req: Request, res: Response) => {
    const callId = req.params.id;
    let resolvedCall: ServiceCall | null = null;
    dbState.service_calls = (dbState.service_calls || []).map((c) => {
      if (c.id === callId || (req.body?.table_number && c.table_number === Number(req.body.table_number) && c.status === 'pending')) {
        resolvedCall = { ...c, status: 'resolved' };
        return resolvedCall;
      }
      return c;
    });
    saveDatabase(dbState);
    res.json({ success: true, call: resolvedCall });
  });

  // 5c. Dish Reviews (Taomlarni yulduzcha va izoh bilan baholash -> Restoran reytingiga ta'sir qiladi)
  app.get('/api/dish-reviews', (req: Request, res: Response) => {
    const { menu_item_id } = req.query;
    let list = [...(dbState.dish_reviews || [])];
    if (menu_item_id) {
      list = list.filter((r) => r.menu_item_id === String(menu_item_id));
    }
    res.json(list);
  });

  app.post('/api/dish-reviews', (req: Request, res: Response) => {
    const { id, menu_item_id, dish_name, table_number, rating, comment, customer_name, created_at } =
      req.body || {};

    const numericRating = Math.round(Number(rating));
    if (!menu_item_id || isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res
        .status(400)
        .json({ error: "menu_item_id va 1 dan 5 gacha baho (rating) kiritilishi shart" });
    }

    const matchedDish = dbState.menu_items.find((m) => m.id === String(menu_item_id));
    const review: DishReview = {
      id: id ? String(id) : `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menu_item_id: String(menu_item_id),
      dish_name: dish_name ? String(dish_name).trim().slice(0, 120) : matchedDish?.name || 'Taom',
      table_number: Math.max(1, Number(table_number) || 1),
      rating: numericRating,
      comment: comment ? String(comment).trim().slice(0, 400) : '',
      customer_name: customer_name ? String(customer_name).trim().slice(0, 60) : undefined,
      created_at: created_at ? String(created_at) : new Date().toISOString(),
    };

    dbState.dish_reviews = [
      review,
      ...(dbState.dish_reviews || []).filter((r) => r.id !== review.id),
    ];
    saveDatabase(dbState);
    res.status(201).json(review);
  });

  // 5d. Order Feedbacks (Umumiy xizmat baholari)
  app.get('/api/feedbacks', (_req: Request, res: Response) => {
    res.json(dbState.feedbacks || []);
  });

  app.post('/api/feedbacks', (req: Request, res: Response) => {
    const body = req.body || {};
    const overall = Math.round(Number(body.overall_rating));
    if (!body.order_id || isNaN(overall) || overall < 1 || overall > 5) {
      return res.status(400).json({ error: "order_id va 1-5 oralig'idagi baho shart" });
    }
    const feedback: CustomerFeedback = {
      id: body.id ? String(body.id) : `feedback-${Date.now()}`,
      order_id: String(body.order_id),
      order_number: String(body.order_number || ''),
      table_number: Math.max(1, Number(body.table_number) || 1),
      waiter_name: body.waiter_name ? String(body.waiter_name).slice(0, 80) : undefined,
      overall_rating: overall,
      food_rating: body.food_rating ? Math.min(5, Math.max(1, Number(body.food_rating))) : undefined,
      speed_rating: body.speed_rating ? Math.min(5, Math.max(1, Number(body.speed_rating))) : undefined,
      waiter_rating: body.waiter_rating ? Math.min(5, Math.max(1, Number(body.waiter_rating))) : undefined,
      atmosphere_rating: body.atmosphere_rating
        ? Math.min(5, Math.max(1, Number(body.atmosphere_rating)))
        : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t).slice(0, 60)) : [],
      comment: body.comment ? String(body.comment).trim().slice(0, 500) : '',
      customer_name: body.customer_name ? String(body.customer_name).trim().slice(0, 60) : undefined,
      customer_phone: body.customer_phone ? String(body.customer_phone).trim().slice(0, 30) : undefined,
      tip_amount: body.tip_amount ? Math.max(0, Number(body.tip_amount)) : undefined,
      created_at: body.created_at ? String(body.created_at) : new Date().toISOString(),
    };

    dbState.feedbacks = [
      feedback,
      ...(dbState.feedbacks || []).filter((f) => f.id !== feedback.id),
    ];
    saveDatabase(dbState);
    res.status(201).json(feedback);
  });

  // 6. Reset Database Endpoint
  app.post('/api/reset', (_req: Request, res: Response) => {
    dbState.categories = [...INITIAL_CATEGORIES];
    dbState.menu_items = [...INITIAL_MENU_ITEMS];
    dbState.orders = [...INITIAL_ORDERS];
    dbState.service_calls = [];
    dbState.dish_reviews = [...INITIAL_DISH_REVIEWS];
    dbState.feedbacks = [];
    saveDatabase(dbState);
    res.json({ status: 'reset_ok', timestamp: dbState.updated_at });
  });

  // Return JSON 404 for unknown API routes so they never fall through to SPA HTML
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint topilmadi' });
  });

  // Mount Vite Dev Server or Production Static Assets (SPA deep-link fallback for /t/:tableNum, /menu, /admin, /waiter)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const lanIp = getLocalNetworkIp();
    console.log(`🚀 DineFlow REST API & Server ishga tushdi: http://localhost:${PORT}`);
    if (lanIp) {
      console.log(`📱 Telefon / QR uchun (Wi-Fi): http://${lanIp}:${PORT}`);
    }
    console.log(`💾 Doimiy JSON Baza:     ${DB_FILE}`);
    console.log(`📘 OpenAPI / Swagger UI: http://localhost:${PORT}/api/docs`);
    console.log(`📄 OpenAPI JSON:         http://localhost:${PORT}/api/openapi.json`);
  });
}

startServer();
