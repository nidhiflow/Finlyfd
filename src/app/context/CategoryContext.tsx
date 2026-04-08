/**
 * CategoryContext — Single Source of Truth for all categories & subcategories.
 *
 * Both CategoriesScreen and AddTransactionScreen read from and write to this
 * context, guaranteeing 100 % real-time synchronisation.
 */
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ─── Types (exported so every screen can share them) ────────────────────────────
export interface Sub {
  id: string;
  name: string;
  emoji: string;
}

export interface Cat {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: "expense" | "income";
  subs: Sub[];
  usage?: number;      // 1–5 frequency dots (CategoriesScreen)
  monthlyEst?: string; // income only: estimated monthly amount
  isCustom?: boolean;
}

// ─── Canonical Category Data ────────────────────────────────────────────────────
// This is THE master list — identical to what CategoriesScreen previously held
// locally. Both screens now derive all data from here.
export const INITIAL_CATEGORIES: Cat[] = [
  /* ════════════════ EXPENSE (17 categories, 90+ subcategories) ════════════════ */
  {
    id:"food", name:"Food & Dining", emoji:"🍽️", color:"#FF6B35", type:"expense", usage:5,
    subs:[
      {id:"fd1", name:"Breakfast",     emoji:"🍳"},
      {id:"fd2", name:"Lunch",         emoji:"🍛"},
      {id:"fd3", name:"Dinner",        emoji:"🍽️"},
      {id:"fd4", name:"Coffee & Tea",  emoji:"☕"},
      {id:"fd5", name:"Soft Drinks",   emoji:"🧃"},
      {id:"fd6", name:"Alcohol",       emoji:"🍺"},
      {id:"fd7", name:"Snacks",        emoji:"🍿"},
      {id:"fd8", name:"Online Orders", emoji:"📦"},
      {id:"fd9", name:"Restaurants",   emoji:"🍴"},
    ],
  },
  {
    id:"health", name:"Health", emoji:"🏥", color:"#06D6A0", type:"expense", usage:3,
    subs:[
      {id:"h1", name:"Doctor Consultation", emoji:"🩺"},
      {id:"h2", name:"Medicines",           emoji:"💊"},
      {id:"h3", name:"Lab Tests",           emoji:"🧪"},
      {id:"h4", name:"Gym",                 emoji:"🏋️"},
      {id:"h5", name:"Sports",              emoji:"⚽"},
      {id:"h6", name:"Supplements",         emoji:"💪"},
    ],
  },
  {
    id:"personal", name:"Personal Care", emoji:"💅", color:"#C77DFF", type:"expense", usage:4,
    subs:[
      {id:"pc1", name:"Salon",                  emoji:"💇"},
      {id:"pc2", name:"Cosmetics",              emoji:"💄"},
      {id:"pc3", name:"Clothing",               emoji:"👗"},
      {id:"pc4", name:"Cosmetic Accessories",   emoji:"👜"},
      {id:"pc5", name:"Clothing Accessories",   emoji:"👒"},
    ],
  },
  {
    id:"provisions", name:"Home Provisions", emoji:"🛒", color:"#4CC9F0", type:"expense", usage:5,
    subs:[
      {id:"pr1", name:"Dairy",          emoji:"🥛"},
      {id:"pr2", name:"Meat",           emoji:"🍖"},
      {id:"pr3", name:"Online Fruits",  emoji:"🍎"},
      {id:"pr4", name:"Online Grocery", emoji:"🛒"},
      {id:"pr5", name:"Online Veggies", emoji:"🥬"},
      {id:"pr6", name:"Shop Fruits",    emoji:"🍉"},
      {id:"pr7", name:"Shop Grocery",   emoji:"🛍️"},
      {id:"pr8", name:"Shop Veggies",   emoji:"🥦"},
    ],
  },
  {
    id:"household", name:"Household", emoji:"🏠", color:"#845EC2", type:"expense", usage:4,
    subs:[
      {id:"hh1", name:"Appliances",          emoji:"📺"},
      {id:"hh2", name:"Decoratives",         emoji:"🖼️"},
      {id:"hh3", name:"Furniture",           emoji:"🛋️"},
      {id:"hh4", name:"Utensils",            emoji:"🍽️"},
      {id:"hh5", name:"Repairs & Maintenance",emoji:"🔧"},
      {id:"hh6", name:"Maid Salary",         emoji:"👩‍🍳"},
      {id:"hh7", name:"Home Rent",           emoji:"🏠"},
      {id:"hh8", name:"Pooja Items",         emoji:"🪔"},
    ],
  },
  {
    id:"invest", name:"Investments", emoji:"📈", color:"#2EC4B6", type:"expense", usage:4,
    subs:[
      {id:"iv1",  name:"Bonds",           emoji:"📜"},
      {id:"iv2",  name:"Digital Gold",    emoji:"🪙"},
      {id:"iv3",  name:"ETF",             emoji:"📊"},
      {id:"iv4",  name:"Health Insurance",emoji:"🏥"},
      {id:"iv5",  name:"Knowledge",       emoji:"📚"},
      {id:"iv6",  name:"Life Insurance",  emoji:"🧾"},
      {id:"iv7",  name:"Mutual Funds",    emoji:"📉"},
      {id:"iv8",  name:"NPS",             emoji:"🧓"},
      {id:"iv9",  name:"Physical Gold",   emoji:"🪙"},
      {id:"iv10", name:"Real Estate",     emoji:"🏡"},
      {id:"iv11", name:"Stocks",          emoji:"📈"},
    ],
  },
  {
    id:"transport", name:"Transport", emoji:"🚗", color:"#4895EF", type:"expense", usage:5,
    subs:[
      {id:"tr1", name:"Flight",  emoji:"✈️"},
      {id:"tr2", name:"Train",   emoji:"🚆"},
      {id:"tr3", name:"Bus",     emoji:"🚌"},
      {id:"tr4", name:"Own Car", emoji:"🚗"},
      {id:"tr5", name:"Taxi",    emoji:"🚕"},
      {id:"tr6", name:"Toll",    emoji:"🛣️"},
      {id:"tr7", name:"Parking", emoji:"🅿️"},
    ],
  },
  {
    id:"trips", name:"Trips & Leisure", emoji:"🏖️", color:"#00B4D8", type:"expense", usage:3,
    subs:[
      {id:"tl1", name:"Flight",         emoji:"✈️"},
      {id:"tl2", name:"Cab/Car",        emoji:"🚕"},
      {id:"tl3", name:"Hotel",          emoji:"🏨"},
      {id:"tl4", name:"Entry Tickets",  emoji:"🎟️"},
      {id:"tl5", name:"Snacks",         emoji:"🍿"},
      {id:"tl6", name:"Fun Activities", emoji:"🎯"},
      {id:"tl7", name:"Fuel",           emoji:"⛽"},
      {id:"tl8", name:"Souvenirs",      emoji:"🛍️"},
    ],
  },
  {
    id:"vehicle", name:"Vehicle", emoji:"🚘", color:"#F7931A", type:"expense", usage:3,
    subs:[
      {id:"ve1", name:"Bike Fuel",        emoji:"⛽"},
      {id:"ve2", name:"Bike Maintenance", emoji:"🔧"},
      {id:"ve3", name:"Car Fuel",         emoji:"⛽"},
      {id:"ve4", name:"Car Maintenance",  emoji:"🔧"},
      {id:"ve5", name:"Penalty",          emoji:"⚠️"},
    ],
  },
  {
    id:"bills", name:"Bills", emoji:"💡", color:"#FFB703", type:"expense", usage:5,
    subs:[
      {id:"bl1", name:"Mobile Recharges", emoji:"📱"},
      {id:"bl2", name:"Wifi",             emoji:"🌐"},
      {id:"bl3", name:"Data Packs",       emoji:"📶"},
      {id:"bl4", name:"Electricity",      emoji:"⚡"},
      {id:"bl5", name:"Gas",              emoji:"🔥"},
    ],
  },
  {
    id:"govt", name:"Government", emoji:"🏛️", color:"#7209B7", type:"expense", usage:2,
    subs:[
      {id:"gv1", name:"Income Tax",   emoji:"💰"},
      {id:"gv2", name:"Property Tax", emoji:"🏠"},
      {id:"gv3", name:"Legal Fee",    emoji:"⚖️"},
      {id:"gv4", name:"Penalty",      emoji:"⚠️"},
    ],
  },
  {
    id:"gifts-out", name:"Gifts", emoji:"🎁", color:"#FF6B9D", type:"expense", usage:2,
    subs:[
      {id:"go1", name:"Family",    emoji:"👨‍👩‍👧"},
      {id:"go2", name:"Friends",   emoji:"🧑‍🤝‍🧑"},
      {id:"go3", name:"Donations", emoji:"🙏"},
    ],
  },
  {
    id:"entertain", name:"Entertainment", emoji:"🎬", color:"#F72585", type:"expense", usage:4,
    subs:[
      {id:"en1", name:"Theater",            emoji:"🎭"},
      {id:"en2", name:"OTT Subscriptions",  emoji:"📺"},
      {id:"en3", name:"DTH",                emoji:"📡"},
      {id:"en4", name:"Events & Concerts",  emoji:"🎤"},
      {id:"en5", name:"Gaming",             emoji:"🎮"},
    ],
  },
  {
    id:"loans-out", name:"Loans & Credits", emoji:"💳", color:"#EF4444", type:"expense", usage:3,
    subs:[
      {id:"lo1", name:"Gold Loan",     emoji:"💍"},
      {id:"lo2", name:"Mortgage Loan", emoji:"🏠"},
      {id:"lo3", name:"Personal Loan", emoji:"💸"},
      {id:"lo4", name:"Car Loan",      emoji:"🚗"},
      {id:"lo5", name:"Bike Loan",     emoji:"🏍️"},
      {id:"lo6", name:"Home Loan",     emoji:"🏡"},
      {id:"lo7", name:"Credit Card",   emoji:"💳"},
    ],
  },
  {
    id:"kids", name:"Kids", emoji:"🎒", color:"#48CAE4", type:"expense", usage:3,
    subs:[
      {id:"kd1", name:"School Fee",  emoji:"🏫"},
      {id:"kd2", name:"Tuition Fee", emoji:"📚"},
      {id:"kd3", name:"Sports Fee",  emoji:"⚽"},
    ],
  },
  {
    id:"biz-out", name:"Business", emoji:"💼", color:"#7C5CFF", type:"expense", usage:2,
    subs:[
      {id:"bz1", name:"Advertising",     emoji:"📢"},
      {id:"bz2", name:"Maintenance",     emoji:"🔧"},
      {id:"bz3", name:"Employee Salary", emoji:"💰"},
      {id:"bz4", name:"Shop Rent",       emoji:"🏢"},
      {id:"bz5", name:"Raw Materials",   emoji:"🏭"},
    ],
  },
  {
    id:"savings", name:"Savings", emoji:"💰", color:"#22C55E", type:"expense", usage:4,
    subs:[
      {id:"sv1", name:"Emergency Fund", emoji:"🚨"},
      {id:"sv2", name:"Savings",        emoji:"💵"},
    ],
  },

  /* ════════════════ INCOME (7 categories) ════════════════ */
  {
    id:"i-salary", name:"Salary", emoji:"💼", color:"#22C55E", type:"income", usage:5,
    monthlyEst:"₹75,000",
    subs:[
      {id:"is1", name:"Husband Salary", emoji:"👨"},
      {id:"is2", name:"Wife Salary",    emoji:"👩"},
    ],
  },
  {
    id:"i-gifts", name:"Gifts & Rewards", emoji:"🎁", color:"#FF6B9D", type:"income", usage:2,
    subs:[
      {id:"ig1", name:"Office Rewards", emoji:"🏢"},
      {id:"ig2", name:"Family Gifts",   emoji:"👨‍👩‍👧"},
      {id:"ig3", name:"Friends Gifts",  emoji:"🧑‍🤝‍🧑"},
    ],
  },
  {
    id:"i-loans", name:"Loans & Returns", emoji:"🔄", color:"#4895EF", type:"income", usage:2,
    subs:[
      {id:"il1", name:"Gold Loan Received",      emoji:"💍"},
      {id:"il2", name:"House Loan Received",     emoji:"🏠"},
      {id:"il3", name:"Family Borrowed Return",  emoji:"👨‍👩‍👧"},
      {id:"il4", name:"Friends Borrowed Return", emoji:"🧑‍🤝‍🧑"},
    ],
  },
  {
    id:"i-refunds", name:"Refunds", emoji:"🔁", color:"#4CC9F0", type:"income", usage:3,
    subs:[
      {id:"irf1", name:"Product Refund", emoji:"💸"},
      {id:"irf2", name:"Service Refund", emoji:"🔄"},
    ],
  },
  {
    id:"i-biz", name:"Business Income", emoji:"🏢", color:"#7C5CFF", type:"income", usage:4,
    monthlyEst:"₹45,000",
    subs:[
      {id:"ib1", name:"Sales Revenue",   emoji:"📢"},
      {id:"ib2", name:"Client Payments", emoji:"💰"},
    ],
  },
  {
    id:"i-rental", name:"Rental Income", emoji:"🏡", color:"#F7931A", type:"income", usage:3,
    monthlyEst:"₹25,000",
    subs:[
      {id:"ire1", name:"House Rent", emoji:"🏢"},
      {id:"ire2", name:"Shop Rent",  emoji:"🏬"},
    ],
  },
  {
    id:"i-interest", name:"Interest Income", emoji:"📈", color:"#2EC4B6", type:"income", usage:3,
    monthlyEst:"₹8,500",
    subs:[
      {id:"ii1", name:"Bank Interest",       emoji:"🏦"},
      {id:"ii2", name:"Investment Interest", emoji:"📊"},
    ],
  },
];

// ─── Context Interface ──────────────────────────────────────────────────────────
interface CategoryContextValue {
  categories: Cat[];

  // Category CRUD
  addCategory:    (cat: Omit<Cat, "id">) => void;
  updateCategory: (id: string, updates: Partial<Cat>) => void;
  deleteCategory: (id: string) => void;

  // Subcategory CRUD
  addSubcategory:    (parentId: string, sub: Omit<Sub, "id">) => void;
  updateSubcategory: (parentId: string, subId: string, updates: Partial<Sub>) => void;
  deleteSubcategory: (parentId: string, subId: string) => void;

  // Helpers
  getCatsByType:  (type: "expense" | "income") => Cat[];
  getCatById:     (id: string) => Cat | undefined;
  getSubById:     (catId: string, subId: string) => Sub | undefined;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const CategoryContext = createContext<CategoryContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────
export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Cat[]>(INITIAL_CATEGORIES);

  // ── Category CRUD ─────────────────────────────────────────────────
  const addCategory = useCallback((cat: Omit<Cat, "id">) => {
    const id = `cat-${Date.now()}`;
    setCategories(prev => [...prev, { ...cat, id, isCustom: true }]);
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Cat>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Subcategory CRUD ──────────────────────────────────────────────
  const addSubcategory = useCallback((parentId: string, sub: Omit<Sub, "id">) => {
    const id = `sub-${Date.now()}`;
    setCategories(prev => prev.map(c =>
      c.id === parentId ? { ...c, subs: [...c.subs, { ...sub, id }] } : c,
    ));
  }, []);

  const updateSubcategory = useCallback((parentId: string, subId: string, updates: Partial<Sub>) => {
    setCategories(prev => prev.map(c =>
      c.id === parentId
        ? { ...c, subs: c.subs.map(s => s.id === subId ? { ...s, ...updates } : s) }
        : c,
    ));
  }, []);

  const deleteSubcategory = useCallback((parentId: string, subId: string) => {
    setCategories(prev => prev.map(c =>
      c.id === parentId ? { ...c, subs: c.subs.filter(s => s.id !== subId) } : c,
    ));
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────
  const getCatsByType  = useCallback((type: "expense" | "income") =>
    categories.filter(c => c.type === type), [categories]);

  const getCatById     = useCallback((id: string) =>
    categories.find(c => c.id === id), [categories]);

  const getSubById     = useCallback((catId: string, subId: string) =>
    categories.find(c => c.id === catId)?.subs.find(s => s.id === subId), [categories]);

  return (
    <CategoryContext.Provider value={{
      categories,
      addCategory, updateCategory, deleteCategory,
      addSubcategory, updateSubcategory, deleteSubcategory,
      getCatsByType, getCatById, getSubById,
    }}>
      {children}
    </CategoryContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useCategoryContext() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error("useCategoryContext must be used inside <CategoryProvider>");
  return ctx;
}
