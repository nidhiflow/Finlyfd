const fs = require('fs');

const FILE_PATH = 'e:/Finly-development/Finlyfd-main/src/app/screens/AddTransactionScreen.tsx';
let code = fs.readFileSync(FILE_PATH, 'utf8');

// Add new imports if needed
if (!code.includes('const AVAILABLE_ICONS = [')) {
  const iconsArray = `
const AVAILABLE_ICONS = [
  { id: 'Briefcase', icon: Briefcase },
  { id: 'CreditCard', icon: CreditCard },
  { id: 'Landmark', icon: Landmark },
  { id: 'Zap', icon: Zap },
  { id: 'Sparkles', icon: Sparkles },
  { id: 'Clock', icon: Clock },
  { id: 'HandCoins', icon: HandCoins },
  { id: 'LineChart', icon: LineChart },
  { id: 'Image', icon: ImageIcon },
  { id: 'Calendar', icon: Calendar }
];
`;
  code = code.replace('const RECENT_IDS = ["food", "vehicle", "bills"];', iconsArray + '\nconst RECENT_IDS = ["food", "vehicle", "bills"];');
}

// Update state
if (!code.includes('const [newIcon, setNewIcon]')) {
  code = code.replace('const [newEmoji, setNewEmoji] = useState("??");', 'const [newEmoji, setNewEmoji] = useState("🏷️");\n  const [newIcon, setNewIcon] = useState<any>(null);\n  const [showIconPicker, setShowIconPicker] = useState(false);');
}

// Update addSub function
if (!code.includes('icon: newIcon')) {
  code = code.replace(
    'addSubcategory(cat.id, { name: newName.trim(), emoji: newEmoji });\n    setNewName(""); setNewEmoji("??"); setAdding(false);',
    'addSubcategory(cat.id, { name: newName.trim(), emoji: newEmoji, icon: newIcon });\n    setNewName(""); setNewEmoji("🏷️"); setNewIcon(null); setAdding(false);'
  );
}

// Update UI
const oldUI = `<input value={newEmoji} onChange={e => setNewEmoji(e.target.value.slice(-2))}
                    className="w-12 text-center rounded-xl text-xl bg-ink/7 focus:outline-none" style={{ fontSize: 20 }} />`;

const newUI = `{showIconPicker ? (
                    <div className="absolute z-10 bg-white shadow-xl rounded-xl p-2 flex flex-wrap gap-2 w-48 border" style={{ borderColor: 'var(--divider)' }}>
                      {AVAILABLE_ICONS.map(ic => (
                        <button key={ic.id} onClick={() => { setNewIcon(() => ic.icon); setShowIconPicker(false); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ink/5">
                          <ic.icon className="w-4 h-4 text-ink" />
                        </button>
                      ))}
                      <button onClick={() => { setNewIcon(null); setShowIconPicker(false); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ink/5 text-xs">
                        🏷️
                      </button>
                    </div>
                  ) : null}
                  <button onClick={() => setShowIconPicker(!showIconPicker)} className="w-12 flex items-center justify-center rounded-xl bg-ink/7 focus:outline-none relative">
                    {newIcon ? (() => { const Icon = newIcon; return <Icon className="w-5 h-5 text-ink" />; })() : <span style={{ fontSize: 20 }}>{newEmoji}</span>}
                  </button>`;

code = code.replace(oldUI, newUI);

fs.writeFileSync(FILE_PATH, code);
console.log('Successfully updated AddTransactionScreen.tsx');
