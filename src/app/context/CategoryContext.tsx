/**
 * CategoryContext — Single Source of Truth for all categories & subcategories.
 *
 * Both CategoriesScreen and AddTransactionScreen read from and write to this
 * context, guaranteeing 100 % real-time synchronisation.
 */
import { createContext, useContext, useState, useCallback, ReactNode, ReactElement } from "react";
import {
  UtensilsCrossed, Egg, Soup, Utensils, Coffee, CupSoda, Beer, Popcorn, Package,
  HeartPulse, Stethoscope, Pill, FlaskConical, Dumbbell, Volleyball, Zap as ZapIcon,
  Sparkles, Scissors, Palette, Shirt, ShoppingBag,
  ShoppingCart, Milk, Beef, Apple, Carrot,
  Home, Tv, Image as ImageIcon, Sofa, Wrench, ChefHat, Flame,
  TrendingUp, FileText, Coins, BarChart3, ShieldCheck, BookOpen, Receipt, TrendingDown, UserRound, Building2,
  Car, Plane, Train, Bus, Fuel, Milestone, ParkingCircle,
  Palmtree, BedDouble, Ticket, Target, ShoppingBag as SouvenirBag,
  Bike, AlertTriangle, Lightbulb, Smartphone, Wifi, Signal,
  Landmark, Scale, Gift, Users, HandHeart,
  Clapperboard, Mic, Gamepad2, CreditCard, Gem,
  Wallet, Backpack, School, Briefcase, Megaphone, Factory,
  PiggyBank, Siren, RefreshCw, RotateCcw, HandCoins, Store, User, LucideIcon
} from "lucide-react";

export type IconType = React.ComponentType<any>;

// ─── Types (exported so every screen can share them) ────────────────────────────
export interface Sub {
  id: string;
  name: string;
  emoji: string;
  icon?: IconType;
}

export interface Cat {
  id: string;
  name: string;
  emoji: string;
  icon?: IconType;
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
    id:"food", name:"Food & Dining", emoji:"🍽️", icon:UtensilsCrossed, color:"#FF6B35", type:"expense", usage:5,
    subs:[
      {id:"fd1", name:"Breakfast",     emoji:"🍳", icon:Egg},
      {id:"fd2", name:"Lunch",         emoji:"🍛", icon:Soup},
      {id:"fd3", name:"Dinner",        emoji:"🍽️", icon:Utensils},
      {id:"fd4", name:"Coffee & Tea",  emoji:"☕", icon:Coffee},
      {id:"fd5", name:"Soft Drinks",   emoji:"🧃", icon:CupSoda},
      {id:"fd6", name:"Alcohol",       emoji:"🍺", icon:Beer},
      {id:"fd7", name:"Snacks",        emoji:"🍿", icon:Popcorn},
      {id:"fd8", name:"Online Orders", emoji:"📦", icon:Package},
      {id:"fd9", name:"Restaurants",   emoji:"🍴", icon:UtensilsCrossed},
    ],
  },
  {
    id:"health", name:"Health", emoji:"🏥", icon:HeartPulse, color:"#06D6A0", type:"expense", usage:3,
    subs:[
      {id:"h1", name:"Doctor Consultation", emoji:"🩺", icon:Stethoscope},
      {id:"h2", name:"Medicines",           emoji:"💊", icon:Pill},
      {id:"h3", name:"Lab Tests",           emoji:"🧪", icon:FlaskConical},
      {id:"h4", name:"Gym",                 emoji:"🏋️", icon:Dumbbell},
      {id:"h5", name:"Sports",              emoji:"⚽", icon:Volleyball},
      {id:"h6", name:"Supplements",         emoji:"💪", icon:Pill},
    ],
  },
  {
    id:"personal", name:"Personal Care", emoji:"💅", icon:Sparkles, color:"#C77DFF", type:"expense", usage:4,
    subs:[
      {id:"pc1", name:"Salon",                  emoji:"💇", icon:Scissors},
      {id:"pc2", name:"Cosmetics",              emoji:"💄", icon:Palette},
      {id:"pc3", name:"Clothing",               emoji:"👗", icon:Shirt},
      {id:"pc4", name:"Cosmetic Accessories",   emoji:"👜", icon:ShoppingBag},
      {id:"pc5", name:"Clothing Accessories",   emoji:"👒", icon:ShoppingBag},
    ],
  },
  {
    id:"provisions", name:"Home Provisions", emoji:"🛒", icon:ShoppingCart, color:"#D4A24C", type:"expense", usage:5,
    subs:[
      {id:"pr1", name:"Dairy",          emoji:"🥛", icon:Milk},
      {id:"pr2", name:"Meat",           emoji:"🍖", icon:Beef},
      {id:"pr3", name:"Online Fruits",  emoji:"🍎", icon:Apple},
      {id:"pr4", name:"Online Grocery", emoji:"🛒", icon:ShoppingCart},
      {id:"pr5", name:"Online Veggies", emoji:"🥬", icon:Carrot},
      {id:"pr6", name:"Shop Fruits",    emoji:"🍉", icon:Apple},
      {id:"pr7", name:"Shop Grocery",   emoji:"🛍️", icon:ShoppingBag},
      {id:"pr8", name:"Shop Veggies",   emoji:"🥦", icon:Carrot},
    ],
  },
  {
    id:"household", name:"Household", emoji:"🏠", icon:Home, color:"#845EC2", type:"expense", usage:4,
    subs:[
      {id:"hh1", name:"Appliances",          emoji:"📺", icon:Tv},
      {id:"hh2", name:"Decoratives",         emoji:"🖼️", icon:ImageIcon},
      {id:"hh3", name:"Furniture",           emoji:"🛋️", icon:Sofa},
      {id:"hh4", name:"Utensils",            emoji:"🍽️", icon:Utensils},
      {id:"hh5", name:"Repairs & Maintenance",emoji:"🔧", icon:Wrench},
      {id:"hh6", name:"Maid Salary",         emoji:"👩‍🍳", icon:ChefHat},
      {id:"hh7", name:"Home Rent",           emoji:"🏠", icon:Home},
      {id:"hh8", name:"Pooja Items",         emoji:"🪔", icon:Flame},
    ],
  },
  {
    id:"invest", name:"Investments", emoji:"📈", icon:TrendingUp, color:"#2EC4B6", type:"expense", usage:4,
    subs:[
      {id:"iv1",  name:"Bonds",           emoji:"📜", icon:FileText},
      {id:"iv2",  name:"Digital Gold",    emoji:"🪙", icon:Coins},
      {id:"iv3",  name:"ETF",             emoji:"📊", icon:BarChart3},
      {id:"iv4",  name:"Health Insurance",emoji:"🏥", icon:ShieldCheck},
      {id:"iv5",  name:"Knowledge",       emoji:"📚", icon:BookOpen},
      {id:"iv6",  name:"Life Insurance",  emoji:"🧾", icon:Receipt},
      {id:"iv7",  name:"Mutual Funds",    emoji:"📉", icon:TrendingDown},
      {id:"iv8",  name:"NPS",             emoji:"🧓", icon:UserRound},
      {id:"iv9",  name:"Physical Gold",   emoji:"🪙", icon:Coins},
      {id:"iv10", name:"Real Estate",     emoji:"🏡", icon:Building2},
      {id:"iv11", name:"Stocks",          emoji:"📈", icon:TrendingUp},
    ],
  },
  {
    id:"transport", name:"Transport", emoji:"🚗", icon:Car, color:"#4895EF", type:"expense", usage:5,
    subs:[
      {id:"tr1", name:"Flight",  emoji:"✈️", icon:Plane},
      {id:"tr2", name:"Train",   emoji:"🚆", icon:Train},
      {id:"tr3", name:"Bus",     emoji:"🚌", icon:Bus},
      {id:"tr4", name:"Own Car", emoji:"🚗", icon:Car},
      {id:"tr5", name:"Taxi",    emoji:"🚕", icon:Car},
      {id:"tr6", name:"Toll",    emoji:"🛣️", icon:Milestone},
      {id:"tr7", name:"Parking", emoji:"🅿️", icon:ParkingCircle},
    ],
  },
  {
    id:"trips", name:"Trips & Leisure", emoji:"🏖️", icon:Palmtree, color:"#00B4D8", type:"expense", usage:3,
    subs:[
      {id:"tl1", name:"Flight",         emoji:"✈️", icon:Plane},
      {id:"tl2", name:"Cab/Car",        emoji:"🚕", icon:Car},
      {id:"tl3", name:"Hotel",          emoji:"🏨", icon:BedDouble},
      {id:"tl4", name:"Entry Tickets",  emoji:"🎟️", icon:Ticket},
      {id:"tl5", name:"Snacks",         emoji:"🍿", icon:Popcorn},
      {id:"tl6", name:"Fun Activities", emoji:"🎯", icon:Target},
      {id:"tl7", name:"Fuel",           emoji:"⛽", icon:Fuel},
      {id:"tl8", name:"Souvenirs",      emoji:"🛍️", icon:SouvenirBag},
    ],
  },
  {
    id:"vehicle", name:"Vehicle", emoji:"🚘", icon:Bike, color:"#F7931A", type:"expense", usage:3,
    subs:[
      {id:"ve1", name:"Bike Fuel",        emoji:"⛽", icon:Fuel},
      {id:"ve2", name:"Bike Maintenance", emoji:"🔧", icon:Wrench},
      {id:"ve3", name:"Car Fuel",         emoji:"⛽", icon:Fuel},
      {id:"ve4", name:"Car Maintenance",  emoji:"🔧", icon:Wrench},
      {id:"ve5", name:"Penalty",          emoji:"⚠️", icon:AlertTriangle},
    ],
  },
  {
    id:"bills", name:"Bills", emoji:"💡", icon:Lightbulb, color:"#FFB703", type:"expense", usage:5,
    subs:[
      {id:"bl1", name:"Mobile Recharges", emoji:"📱", icon:Smartphone},
      {id:"bl2", name:"Wifi",             emoji:"🌐", icon:Wifi},
      {id:"bl3", name:"Data Packs",       emoji:"📶", icon:Signal},
      {id:"bl4", name:"Electricity",      emoji:"⚡", icon:ZapIcon},
      {id:"bl5", name:"Gas",              emoji:"🔥", icon:Flame},
    ],
  },
  {
    id:"govt", name:"Government", emoji:"🏛️", icon:Landmark, color:"#7209B7", type:"expense", usage:2,
    subs:[
      {id:"gv1", name:"Income Tax",   emoji:"💰", icon:Receipt},
      {id:"gv2", name:"Property Tax", emoji:"🏠", icon:Home},
      {id:"gv3", name:"Legal Fee",    emoji:"⚖️", icon:Scale},
      {id:"gv4", name:"Penalty",      emoji:"⚠️", icon:AlertTriangle},
    ],
  },
  {
    id:"gifts-out", name:"Gifts", emoji:"🎁", icon:Gift, color:"#FF6B9D", type:"expense", usage:2,
    subs:[
      {id:"go1", name:"Family",    emoji:"👨‍👩‍👧", icon:Users},
      {id:"go2", name:"Friends",   emoji:"🧑‍🤝‍🧑", icon:Users},
      {id:"go3", name:"Donations", emoji:"🙏", icon:HandHeart},
    ],
  },
  {
    id:"entertain", name:"Entertainment", emoji:"🎬", icon:Clapperboard, color:"#F72585", type:"expense", usage:4,
    subs:[
      {id:"en1", name:"Theater",            emoji:"🎭", icon:Clapperboard},
      {id:"en2", name:"OTT Subscriptions",  emoji:"📺", icon:Tv},
      {id:"en3", name:"DTH",                emoji:"📡", icon:Tv},
      {id:"en4", name:"Events & Concerts",  emoji:"🎤", icon:Mic},
      {id:"en5", name:"Gaming",             emoji:"🎮", icon:Gamepad2},
    ],
  },
  {
    id:"loans-out", name:"Loans & Credits", emoji:"💳", icon:CreditCard, color:"#EF4444", type:"expense", usage:3,
    subs:[
      {id:"lo1", name:"Gold Loan",     emoji:"💍", icon:Gem},
      {id:"lo2", name:"Mortgage Loan", emoji:"🏠", icon:Home},
      {id:"lo3", name:"Personal Loan", emoji:"💸", icon:Wallet},
      {id:"lo4", name:"Car Loan",      emoji:"🚗", icon:Car},
      {id:"lo5", name:"Bike Loan",     emoji:"🏍️", icon:Bike},
      {id:"lo6", name:"Home Loan",     emoji:"🏡", icon:Home},
      {id:"lo7", name:"Credit Card",   emoji:"💳", icon:CreditCard},
    ],
  },
  {
    id:"kids", name:"Kids", emoji:"🎒", icon:Backpack, color:"#48CAE4", type:"expense", usage:3,
    subs:[
      {id:"kd1", name:"School Fee",  emoji:"🏫", icon:School},
      {id:"kd2", name:"Tuition Fee", emoji:"📚", icon:BookOpen},
      {id:"kd3", name:"Sports Fee",  emoji:"⚽", icon:Volleyball},
    ],
  },
  {
    id:"biz-out", name:"Business", emoji:"💼", icon:Briefcase, color:"#D4A24C", type:"expense", usage:2,
    subs:[
      {id:"bz1", name:"Advertising",     emoji:"📢", icon:Megaphone},
      {id:"bz2", name:"Maintenance",     emoji:"🔧", icon:Wrench},
      {id:"bz3", name:"Employee Salary", emoji:"💰", icon:HandCoins},
      {id:"bz4", name:"Shop Rent",       emoji:"🏢", icon:Store},
      {id:"bz5", name:"Raw Materials",   emoji:"🏭", icon:Factory},
    ],
  },
  {
    id:"savings", name:"Savings", emoji:"💰", icon:PiggyBank, color:"#22C55E", type:"expense", usage:4,
    subs:[
      {id:"sv1", name:"Emergency Fund", emoji:"🚨", icon:Siren},
      {id:"sv2", name:"Savings",        emoji:"💵", icon:PiggyBank},
    ],
  },

  /* ════════════════ INCOME (7 categories) ════════════════ */
  {
    id:"i-salary", name:"Salary", emoji:"💼", icon:Briefcase, color:"#22C55E", type:"income", usage:5,
    monthlyEst:"₹75,000",
    subs:[
      {id:"is1", name:"Husband Salary", emoji:"👨", icon:User},
      {id:"is2", name:"Wife Salary",    emoji:"👩", icon:User},
    ],
  },
  {
    id:"i-gifts", name:"Gifts & Rewards", emoji:"🎁", icon:Gift, color:"#FF6B9D", type:"income", usage:2,
    subs:[
      {id:"ig1", name:"Office Rewards", emoji:"🏢", icon:Building2},
      {id:"ig2", name:"Family Gifts",   emoji:"👨‍👩‍👧", icon:Users},
      {id:"ig3", name:"Friends Gifts",  emoji:"🧑‍🤝‍🧑", icon:Users},
    ],
  },
  {
    id:"i-loans", name:"Loans & Returns", emoji:"🔄", icon:RefreshCw, color:"#4895EF", type:"income", usage:2,
    subs:[
      {id:"il1", name:"Gold Loan Received",      emoji:"💍", icon:Gem},
      {id:"il2", name:"House Loan Received",     emoji:"🏠", icon:Home},
      {id:"il3", name:"Family Borrowed Return",  emoji:"👨‍👩‍👧", icon:Users},
      {id:"il4", name:"Friends Borrowed Return", emoji:"🧑‍🤝‍🧑", icon:Users},
    ],
  },
  {
    id:"i-refunds", name:"Refunds", emoji:"🔁", icon:RotateCcw, color:"#D4A24C", type:"income", usage:3,
    subs:[
      {id:"irf1", name:"Product Refund", emoji:"💸", icon:Package},
      {id:"irf2", name:"Service Refund", emoji:"🔄", icon:RefreshCw},
    ],
  },
  {
    id:"i-biz", name:"Business Income", emoji:"🏢", icon:Building2, color:"#D4A24C", type:"income", usage:4,
    monthlyEst:"₹45,000",
    subs:[
      {id:"ib1", name:"Sales Revenue",   emoji:"📢", icon:Megaphone},
      {id:"ib2", name:"Client Payments", emoji:"💰", icon:HandCoins},
    ],
  },
  {
    id:"i-rental", name:"Rental Income", emoji:"🏡", icon:Home, color:"#F7931A", type:"income", usage:3,
    monthlyEst:"₹25,000",
    subs:[
      {id:"ire1", name:"House Rent", emoji:"🏢", icon:Building2},
      {id:"ire2", name:"Shop Rent",  emoji:"🏬", icon:Store},
    ],
  },
  {
    id:"i-interest", name:"Interest Income", emoji:"📈", icon:TrendingUp, color:"#2EC4B6", type:"income", usage:3,
    monthlyEst:"₹8,500",
    subs:[
      {id:"ii1", name:"Bank Interest",       emoji:"🏦", icon:Landmark},
      {id:"ii2", name:"Investment Interest", emoji:"📊", icon:BarChart3},
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

