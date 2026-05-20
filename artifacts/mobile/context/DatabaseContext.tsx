import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  photoUri: string;
  createdAt: string;
}

export interface Measurement {
  id: string;
  customerId: string;
  name: string;
  bazu: number | null;
  tera: number | null;
  gala: number | null;
  chati: number | null;
  kamar: number | null;
  ghera: number | null;
  shilwarLambai: number | null;
  shirtLambai: number | null;
  paincha: number | null;
  notes: string;
  collar: "collar" | "bain";
  gheraType: "square" | "round";
  shilwarJaib: number;
  shirtFrontJaib: number;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  measurementId: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "delivered";
  dueDate: string;
  price: number;
  advancePayment: number;
  notes: string;
  createdAt: string;
}

export interface Stats {
  totalCustomers: number;
  activeOrders: number;
  totalRevenue: number;
  pendingAmount: number;
}

export interface ExportData {
  customers: Customer[];
  measurements: Measurement[];
  orders: Order[];
}

export interface DatabaseContextType {
  isReady: boolean;
  getCustomers: (search?: string) => Customer[];
  getCustomer: (id: string) => Customer | null;
  addCustomer: (data: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (id: string, data: Omit<Customer, "id" | "createdAt">) => void;
  deleteCustomer: (id: string) => void;
  getMeasurements: (customerId: string) => Measurement[];
  getMeasurement: (id: string) => Measurement | null;
  addMeasurement: (customerId: string, data: Omit<Measurement, "id" | "customerId" | "updatedAt">) => Measurement;
  updateMeasurement: (id: string, data: Omit<Measurement, "id" | "customerId" | "updatedAt">) => void;
  deleteMeasurement: (id: string) => void;
  getOrders: (status?: string) => Order[];
  getOrder: (id: string) => Order | null;
  getCustomerOrders: (customerId: string) => Order[];
  addOrder: (data: Omit<Order, "id" | "createdAt" | "customerName">) => Order;
  updateOrder: (id: string, data: Omit<Order, "id" | "createdAt" | "customerName">) => void;
  deleteOrder: (id: string) => void;
  getStats: () => Stats;
  getExportData: () => ExportData;
  importData: (data: Partial<ExportData>) => void;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

let db: SQLite.SQLiteDatabase | null = null;
function getDb(): SQLite.SQLiteDatabase {
  if (!db) db = SQLite.openDatabaseSync("tailormaster.db");
  return db;
}

function initDatabase() {
  const database = getDb();
  database.execSync(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      photoUri TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );
  `);
  try { database.execSync(`ALTER TABLE customers ADD COLUMN photoUri TEXT DEFAULT ''`); } catch {}

  const hasBazu = database.getFirstSync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM pragma_table_info('measurements') WHERE name='bazu'"
  );
  if (!hasBazu?.cnt) {
    database.execSync(`DROP TABLE IF EXISTS measurements;`);
    database.execSync(`
      CREATE TABLE measurements (
        id TEXT PRIMARY KEY,
        customerId TEXT NOT NULL,
        name TEXT DEFAULT 'پیمائش',
        bazu REAL,
        tera REAL,
        gala REAL,
        chati REAL,
        kamar REAL,
        ghera REAL,
        shilwarLambai REAL,
        shirtLambai REAL,
        paincha REAL,
        notes TEXT DEFAULT '',
        collar TEXT DEFAULT 'collar',
        gheraType TEXT DEFAULT 'square',
        shilwarJaib INTEGER DEFAULT 0,
        shirtFrontJaib INTEGER DEFAULT 0,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
      );
    `);
  } else {
    try { database.execSync(`ALTER TABLE measurements ADD COLUMN shirtLambai REAL`); } catch {}
  }

  database.execSync(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      measurementId TEXT DEFAULT '',
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      dueDate TEXT DEFAULT '',
      price REAL DEFAULT 0,
      advancePayment REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);
  try { database.execSync(`ALTER TABLE orders ADD COLUMN measurementId TEXT DEFAULT ''`); } catch {}
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") { setIsReady(true); return; }
    try { initDatabase(); setIsReady(true); }
    catch (e) { console.error("DB init error:", e); setIsReady(true); }
  }, []);

  const getCustomers = (search?: string): Customer[] => {
    if (Platform.OS === "web") return [];
    try {
      if (search?.trim()) {
        return getDb().getAllSync<Customer>(
          "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC",
          [`%${search}%`, `%${search}%`]
        );
      }
      return getDb().getAllSync<Customer>("SELECT * FROM customers ORDER BY name ASC");
    } catch { return []; }
  };

  const getCustomer = (id: string): Customer | null => {
    if (Platform.OS === "web") return null;
    try { return getDb().getFirstSync<Customer>("SELECT * FROM customers WHERE id = ?", [id]) ?? null; }
    catch { return null; }
  };

  const addCustomer = (data: Omit<Customer, "id" | "createdAt">): Customer => {
    const customer: Customer = { id: generateId(), ...data, createdAt: new Date().toISOString() };
    if (Platform.OS !== "web") {
      getDb().runSync(
        "INSERT INTO customers (id, name, phone, address, notes, photoUri, createdAt) VALUES (?,?,?,?,?,?,?)",
        [customer.id, customer.name, customer.phone, customer.address, customer.notes, customer.photoUri, customer.createdAt]
      );
    }
    return customer;
  };

  const updateCustomer = (id: string, data: Omit<Customer, "id" | "createdAt">) => {
    if (Platform.OS === "web") return;
    getDb().runSync(
      "UPDATE customers SET name=?, phone=?, address=?, notes=?, photoUri=? WHERE id=?",
      [data.name, data.phone, data.address, data.notes, data.photoUri, id]
    );
  };

  const deleteCustomer = (id: string) => {
    if (Platform.OS === "web") return;
    getDb().runSync("DELETE FROM customers WHERE id = ?", [id]);
  };

  const getMeasurements = (customerId: string): Measurement[] => {
    if (Platform.OS === "web") return [];
    try {
      return getDb().getAllSync<Measurement>(
        "SELECT * FROM measurements WHERE customerId = ? ORDER BY updatedAt ASC",
        [customerId]
      );
    } catch { return []; }
  };

  const getMeasurement = (id: string): Measurement | null => {
    if (Platform.OS === "web") return null;
    try { return getDb().getFirstSync<Measurement>("SELECT * FROM measurements WHERE id = ?", [id]) ?? null; }
    catch { return null; }
  };

  const addMeasurement = (customerId: string, data: Omit<Measurement, "id" | "customerId" | "updatedAt">): Measurement => {
    const m: Measurement = { id: generateId(), customerId, ...data, updatedAt: new Date().toISOString() };
    if (Platform.OS !== "web") {
      getDb().runSync(
        `INSERT INTO measurements (id,customerId,name,bazu,tera,gala,chati,kamar,ghera,shilwarLambai,shirtLambai,paincha,notes,collar,gheraType,shilwarJaib,shirtFrontJaib,updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [m.id, m.customerId, m.name, m.bazu, m.tera, m.gala, m.chati, m.kamar, m.ghera, m.shilwarLambai, m.shirtLambai, m.paincha, m.notes, m.collar, m.gheraType, m.shilwarJaib ? 1 : 0, m.shirtFrontJaib ? 1 : 0, m.updatedAt]
      );
    }
    return m;
  };

  const updateMeasurement = (id: string, data: Omit<Measurement, "id" | "customerId" | "updatedAt">) => {
    if (Platform.OS === "web") return;
    getDb().runSync(
      `UPDATE measurements SET name=?,bazu=?,tera=?,gala=?,chati=?,kamar=?,ghera=?,shilwarLambai=?,shirtLambai=?,paincha=?,notes=?,collar=?,gheraType=?,shilwarJaib=?,shirtFrontJaib=?,updatedAt=? WHERE id=?`,
      [data.name, data.bazu, data.tera, data.gala, data.chati, data.kamar, data.ghera, data.shilwarLambai, data.shirtLambai, data.paincha, data.notes, data.collar, data.gheraType, data.shilwarJaib ? 1 : 0, data.shirtFrontJaib ? 1 : 0, new Date().toISOString(), id]
    );
  };

  const deleteMeasurement = (id: string) => {
    if (Platform.OS === "web") return;
    getDb().runSync("DELETE FROM measurements WHERE id = ?", [id]);
  };

  const getOrders = (status?: string): Order[] => {
    if (Platform.OS === "web") return [];
    try {
      if (status && status !== "all") {
        return getDb().getAllSync<Order>(
          "SELECT o.*, c.name as customerName FROM orders o LEFT JOIN customers c ON o.customerId = c.id WHERE o.status = ? ORDER BY o.createdAt DESC",
          [status]
        );
      }
      return getDb().getAllSync<Order>(
        "SELECT o.*, c.name as customerName FROM orders o LEFT JOIN customers c ON o.customerId = c.id ORDER BY o.createdAt DESC"
      );
    } catch { return []; }
  };

  const getOrder = (id: string): Order | null => {
    if (Platform.OS === "web") return null;
    try {
      return getDb().getFirstSync<Order>(
        "SELECT o.*, c.name as customerName FROM orders o LEFT JOIN customers c ON o.customerId = c.id WHERE o.id = ?",
        [id]
      ) ?? null;
    } catch { return null; }
  };

  const getCustomerOrders = (customerId: string): Order[] => {
    if (Platform.OS === "web") return [];
    try {
      return getDb().getAllSync<Order>(
        "SELECT o.*, c.name as customerName FROM orders o LEFT JOIN customers c ON o.customerId = c.id WHERE o.customerId = ? ORDER BY o.createdAt DESC",
        [customerId]
      );
    } catch { return []; }
  };

  const addOrder = (data: Omit<Order, "id" | "createdAt" | "customerName">): Order => {
    const order: Order = { id: generateId(), ...data, customerName: "", createdAt: new Date().toISOString() };
    if (Platform.OS !== "web") {
      getDb().runSync(
        "INSERT INTO orders (id,customerId,measurementId,description,status,dueDate,price,advancePayment,notes,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [order.id, order.customerId, order.measurementId, order.description, order.status, order.dueDate, order.price, order.advancePayment, order.notes, order.createdAt]
      );
    }
    return order;
  };

  const updateOrder = (id: string, data: Omit<Order, "id" | "createdAt" | "customerName">) => {
    if (Platform.OS === "web") return;
    getDb().runSync(
      "UPDATE orders SET customerId=?,measurementId=?,description=?,status=?,dueDate=?,price=?,advancePayment=?,notes=? WHERE id=?",
      [data.customerId, data.measurementId, data.description, data.status, data.dueDate, data.price, data.advancePayment, data.notes, id]
    );
  };

  const deleteOrder = (id: string) => {
    if (Platform.OS === "web") return;
    getDb().runSync("DELETE FROM orders WHERE id = ?", [id]);
  };

  const getStats = (): Stats => {
    if (Platform.OS === "web") return { totalCustomers: 0, activeOrders: 0, totalRevenue: 0, pendingAmount: 0 };
    try {
      const database = getDb();
      const totalCustomers = (database.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM customers") ?? { count: 0 }).count;
      const activeOrders = (database.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending','in-progress')") ?? { count: 0 }).count;
      const totalRevenue = (database.getFirstSync<{ total: number | null }>("SELECT SUM(price) as total FROM orders WHERE status = 'delivered'"))?.total ?? 0;
      const pendingAmount = (database.getFirstSync<{ pending: number | null }>("SELECT SUM(price - advancePayment) as pending FROM orders WHERE status != 'delivered'"))?.pending ?? 0;
      return { totalCustomers, activeOrders, totalRevenue, pendingAmount };
    } catch { return { totalCustomers: 0, activeOrders: 0, totalRevenue: 0, pendingAmount: 0 }; }
  };

  const getExportData = (): ExportData => {
    if (Platform.OS === "web") return { customers: [], measurements: [], orders: [] };
    try {
      const customers = getDb().getAllSync<Customer>("SELECT * FROM customers ORDER BY createdAt ASC");
      const measurements = getDb().getAllSync<Measurement>("SELECT * FROM measurements ORDER BY updatedAt ASC");
      const orders = getDb().getAllSync<Order>("SELECT * FROM orders ORDER BY createdAt ASC");
      return { customers, measurements, orders };
    } catch { return { customers: [], measurements: [], orders: [] }; }
  };

  const importData = (data: Partial<ExportData>) => {
    if (Platform.OS === "web") return;
    const database = getDb();
    try {
      database.execSync("DELETE FROM orders");
      database.execSync("DELETE FROM measurements");
      database.execSync("DELETE FROM customers");
      for (const c of (data.customers ?? [])) {
        try {
          database.runSync(
            "INSERT OR REPLACE INTO customers (id,name,phone,address,notes,photoUri,createdAt) VALUES (?,?,?,?,?,?,?)",
            [c.id, c.name, c.phone ?? "", c.address ?? "", c.notes ?? "", c.photoUri ?? "", c.createdAt]
          );
        } catch {}
      }
      for (const m of (data.measurements ?? [])) {
        try {
          database.runSync(
            `INSERT OR REPLACE INTO measurements (id,customerId,name,bazu,tera,gala,chati,kamar,ghera,shilwarLambai,shirtLambai,paincha,notes,collar,gheraType,shilwarJaib,shirtFrontJaib,updatedAt)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [m.id, m.customerId, m.name ?? "پیمائش", m.bazu ?? null, m.tera ?? null, m.gala ?? null, m.chati ?? null, m.kamar ?? null, m.ghera ?? null, m.shilwarLambai ?? null, m.shirtLambai ?? null, m.paincha ?? null, m.notes ?? "", m.collar ?? "collar", m.gheraType ?? "square", m.shilwarJaib ? 1 : 0, m.shirtFrontJaib ? 1 : 0, m.updatedAt ?? new Date().toISOString()]
          );
        } catch {}
      }
      for (const o of (data.orders ?? [])) {
        try {
          database.runSync(
            "INSERT OR REPLACE INTO orders (id,customerId,measurementId,description,status,dueDate,price,advancePayment,notes,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)",
            [o.id, o.customerId, o.measurementId ?? "", o.description, o.status ?? "pending", o.dueDate ?? "", o.price ?? 0, o.advancePayment ?? 0, o.notes ?? "", o.createdAt]
          );
        } catch {}
      }
    } catch (e) { console.error("Import error:", e); }
  };

  const value: DatabaseContextType = {
    isReady, getCustomers, getCustomer, addCustomer, updateCustomer, deleteCustomer,
    getMeasurements, getMeasurement, addMeasurement, updateMeasurement, deleteMeasurement,
    getOrders, getOrder, getCustomerOrders, addOrder, updateOrder, deleteOrder, getStats,
    getExportData, importData,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseContextType {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error("useDatabase must be used inside DatabaseProvider");
  return ctx;
}
