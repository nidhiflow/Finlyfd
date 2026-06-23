const fs = require('fs');

const FILE_PATH = 'e:/Finly-development/Finlyfd-main/src/app/screens/AddTransactionScreen.tsx';
let code = fs.readFileSync(FILE_PATH, 'utf8');

// 1. Add new state variables after setRecurFreq
if (!code.includes('const [recurInterval')) {
  code = code.replace(
    'const [recurFreq, setRecurFreq] = useState<string>("monthly");',
    `const [recurFreq, setRecurFreq] = useState<string>("monthly");
  const [recurInterval, setRecurInterval] = useState<number>(1);
  const [recurDayOfMonth, setRecurDayOfMonth] = useState<number | null>(null);
  const [recurEndType, setRecurEndType] = useState<string>("never");
  const [recurEndDate, setRecurEndDate] = useState<Date | null>(null);
  const [recurOccurrences, setRecurOccurrences] = useState<string>("");
  const [recurAutoCreate, setRecurAutoCreate] = useState<boolean>(true);
  const [recurReminder, setRecurReminder] = useState<number>(0);`
  );
}

// 2. Update initialization when editing
if (!code.includes('setRecurInterval((tx as any).repeat_interval')) {
  code = code.replace(
    'setRecurFreq((tx as any).repeat_frequency);',
    `setRecurFreq((tx as any).repeat_frequency);
            if ((tx as any).repeat_interval) setRecurInterval((tx as any).repeat_interval);
            if ((tx as any).repeat_day_of_month) setRecurDayOfMonth((tx as any).repeat_day_of_month);
            if ((tx as any).repeat_end_type) setRecurEndType((tx as any).repeat_end_type);
            if ((tx as any).repeat_occurrences_total) setRecurOccurrences(String((tx as any).repeat_occurrences_total));
            if ((tx as any).auto_create !== undefined) setRecurAutoCreate((tx as any).auto_create);
            if ((tx as any).reminder_days_before) setRecurReminder((tx as any).reminder_days_before);`
  );
}

// 3. Update handleSave payload
if (!code.includes('repeat_interval: recurring ? recurInterval : null')) {
  code = code.replace(
    'repeat_frequency: recurring ? recurFreq : null\n      };',
    `repeat_frequency: recurring ? recurFreq : null,
        repeat_interval: recurring ? recurInterval : null,
        repeat_day_of_month: recurring ? recurDayOfMonth : null,
        repeat_end_type: recurring ? recurEndType : null,
        repeat_occurrences_total: recurring && recurEndType === 'after_n' ? parseInt(recurOccurrences) || null : null,
        auto_create: recurring ? recurAutoCreate : true,
        reminder_days_before: recurring ? recurReminder : null
      };`
  );
}

// 4. Update the UI for Repeat settings
// Find the "Repeat" list item button
const repeatButtonRegex = /<div className="flex items-center gap-3">\s*<div className="w-10 h-10.*?<Repeat className="w-5 h-5.*?\s*<\/div>\s*<span.*?Repeat<\/span>\s*<\/div>\s*<div className="flex items-center gap-2">\s*\{recurring && \(\s*<span.*?\{REPEAT_OPTIONS\.find[\s\S]*?<\/div>\s*<\/button>/g;

const newRepeatUI = `{/* Repeat Toggle */}
              <div className="flex items-center justify-between p-4 mb-2 rounded-2xl" style={{background: "color-mix(in srgb, var(--ink) 3%, transparent)"}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: \`\${typeAccent}15\`, color: typeAccent }}>
                    <Repeat className="w-5 h-5" />
                  </div>
                  <span className="text-ink font-semibold">Recurring Transaction</span>
                </div>
                <button 
                  onClick={() => {
                    if (!recurring) { setRecurring(true); setRecurFreq('monthly'); }
                    else { setRecurring(false); }
                  }}
                  className="relative w-12 h-7 rounded-full transition-colors"
                  style={{ background: recurring ? typeAccent : "var(--divider)" }}>
                  <motion.div layout
                    className="absolute top-1 bottom-1 w-5 bg-white rounded-full shadow-sm"
                    initial={false}
                    animate={{ left: recurring ? "calc(100% - 24px)" : "4px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Detailed Recurrence Configuration */}
              <AnimatePresence>
                {recurring && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="p-4 rounded-2xl space-y-4" style={{ background: "color-mix(in srgb, var(--ink) 2%, transparent)" }}>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-ink/50 uppercase tracking-wider">Frequency</label>
                        <div className="flex gap-2 bg-ink/5 p-1 rounded-xl">
                          {['daily','weekly','monthly','yearly'].map(f => (
                            <button key={f} onClick={() => setRecurFreq(f)}
                              className="flex-1 py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
                              style={{
                                background: recurFreq === f ? 'var(--bg)' : 'transparent',
                                color: recurFreq === f ? 'var(--ink)' : 'var(--ink)',
                                opacity: recurFreq === f ? 1 : 0.6,
                                boxShadow: recurFreq === f ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                              }}>
                              {f.replace('ly', '')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-ink shrink-0">Repeat every</label>
                        <input type="number" min="1" max="99" value={recurInterval} onChange={e => setRecurInterval(parseInt(e.target.value) || 1)}
                          className="w-16 bg-ink/5 rounded-lg text-center font-semibold text-ink h-9 outline-none focus:ring-2"
                          style={{ borderColor: "transparent", '--tw-ring-color': typeAccent } as any} />
                        <span className="text-sm font-medium text-ink/60 capitalize">
                          {recurFreq === 'daily' ? 'Days' : recurFreq === 'weekly' ? 'Weeks' : recurFreq === 'monthly' ? 'Months' : 'Years'}
                        </span>
                      </div>

                      {recurFreq === 'monthly' && (
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-ink shrink-0">On day</label>
                          <select value={recurDayOfMonth || ''} onChange={e => setRecurDayOfMonth(parseInt(e.target.value) || null)}
                            className="flex-1 bg-ink/5 rounded-lg font-semibold text-ink h-9 px-3 outline-none focus:ring-2"
                            style={{ borderColor: "transparent", '--tw-ring-color': typeAccent } as any}>
                            <option value="">Same as Start Date</option>
                            {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="h-px w-full bg-ink/10 my-2" />

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-ink/50 uppercase tracking-wider">End Condition</label>
                        <select value={recurEndType} onChange={e => setRecurEndType(e.target.value)}
                          className="w-full bg-ink/5 rounded-lg font-medium text-ink h-10 px-3 outline-none focus:ring-2"
                          style={{ borderColor: "transparent", '--tw-ring-color': typeAccent } as any}>
                          <option value="never">Never (Run infinitely)</option>
                          <option value="after_n">After specific number of times</option>
                        </select>
                      </div>

                      {recurEndType === 'after_n' && (
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-ink shrink-0">Total occurrences</label>
                          <input type="number" min="1" max="999" value={recurOccurrences} onChange={e => setRecurOccurrences(e.target.value)}
                            placeholder="e.g. 12"
                            className="flex-1 bg-ink/5 rounded-lg text-left px-3 font-semibold text-ink h-9 outline-none focus:ring-2"
                            style={{ borderColor: "transparent", '--tw-ring-color': typeAccent } as any} />
                        </div>
                      )}

                      <div className="h-px w-full bg-ink/10 my-2" />

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-ink">Auto-create</span>
                          <span className="text-xs text-ink/50">Generate automatically when due</span>
                        </div>
                        <button 
                          onClick={() => setRecurAutoCreate(!recurAutoCreate)}
                          className="relative w-11 h-6 rounded-full transition-colors"
                          style={{ background: recurAutoCreate ? typeAccent : "var(--divider)" }}>
                          <motion.div layout
                            className="absolute top-1 bottom-1 w-4 bg-white rounded-full shadow-sm"
                            initial={false}
                            animate={{ left: recurAutoCreate ? "calc(100% - 20px)" : "4px" }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </button>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>`;

code = code.replace(repeatButtonRegex, newRepeatUI);

fs.writeFileSync(FILE_PATH, code);
console.log('Successfully updated AddTransactionScreen.tsx');
