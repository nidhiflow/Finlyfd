const fs = require('fs');

const file = 'src/app/screens/AddTransactionScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const returnStart = content.indexOf('return (\n    <div className="relative" style={{ background: "var(--bg-deep)", minHeight: "100vh" }}>');

if (returnStart === -1) {
  console.log("Could not find return statement");
  process.exit(1);
}

const beforeReturn = content.slice(0, returnStart);

const newReturnJSX = `return (
    <div className="relative flex flex-col justify-between" style={{ background: "var(--bg-deep)", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 pointer-events-none"
        style={{ background: \`radial-gradient(ellipse at 50% 0%,\${typeAccent}14 0%,transparent 70%)\`, transition: "background 0.4s" }} />

      <div className="relative z-10 flex-1 flex flex-col pt-2 pb-2">

        {/* ── Type Toggle ── */}
        <div className="flex gap-2 mx-4 mb-4 bg-[var(--surface)] rounded-[12px] p-1.5">
          {[
            { id: "expense" as TxType, label: "Expense", icon: ArrowUpCircle },
            { id: "income" as TxType, label: "Income", icon: ArrowDownCircle },
            { id: "transfer" as TxType, label: "Transfer", icon: RefreshCw },
          ].map(t => {
            const isActive = txType === t.id;
            return (
              <motion.button
                key={t.id}
                onClick={() => switchType(t.id)}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] transition-colors"
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  background: isActive ? \`\${typeAccent}33\` : "transparent",
                  color: isActive ? typeAccent : "var(--ink-muted)",
                }}>
                <t.icon className="w-[14px] h-[14px]" strokeWidth={1.75} />
                {t.label}
              </motion.button>
            )
          })}
        </div>

        {/* ── Amount Card ── */}
        <div className="mx-4 mb-4 bg-[var(--surface)] rounded-[16px] p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: \`radial-gradient(circle,\${typeAccent}15 0%,transparent 70%)\` }} />
          <div className="flex justify-between items-center mb-2 relative z-10">
            <p className="text-[10px] tracking-[0.07em] uppercase text-[var(--ink-muted)] m-0">
              {txType === "income" ? "INCOME AMOUNT" : txType === "transfer" ? "TRANSFER AMOUNT" : "EXPENSE AMOUNT"}
            </p>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCalc(true)}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-[16px]"
              style={{
                 color: typeAccent,
                 background: \`\${typeAccent}25\`
              }}>
              <Calculator className="w-[13px] h-[13px]" style={{ color: typeAccent }} />
              Calc
            </motion.button>
          </div>
          <div className="flex items-baseline gap-1.5 font-fraunces font-medium text-[38px] relative z-10" style={{ color: typeAccent }}>
            <span className="text-[22px] text-[var(--ink-faint)]">₹</span>
            <input
              type="text" inputMode="decimal"
              value={amount} onChange={e => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                if ((v.match(/\\./g) || []).length <= 1) setAmount(v);
              }}
              placeholder="0"
              className="flex-1 bg-transparent font-fraunces font-medium focus:outline-none placeholder:text-[var(--ink-faint)] tabular-nums"
              style={{ color: typeAccent, width: "100%", letterSpacing: "-1px" }}
            />
          </div>
          {errors.amount && (
            <p className="text-rose-400 mt-1" style={{ fontSize: 11 }}>{errors.amount}</p>
          )}
        </div>

        {/* ── Note ── */}
        <div className="mx-4 mb-4 bg-[var(--surface)] rounded-[14px] px-4 py-3.5 relative z-40">
           <div className="flex items-center gap-2">
             <p className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] m-0 w-[45px]">Note</p>
             <input
                value={note}
                onChange={e => { setNote(e.target.value); setShowNoteSuggestions(true); }}
                onFocus={() => setShowNoteSuggestions(true)}
                onBlur={() => setTimeout(() => setShowNoteSuggestions(false), 200)}
                placeholder="What was this for?"
                className="flex-1 bg-transparent border-none text-[var(--ink)] font-inter text-[13.5px] outline-none placeholder:text-[var(--ink-faint)]"
             />
           </div>
           <AnimatePresence>
             {showNoteSuggestions && note.length > 0 && filteredNotes.length > 0 && (
               <motion.div
                 initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                 className="absolute top-full left-0 right-0 mt-1.5 rounded-[12px] overflow-hidden z-50 max-h-40 overflow-y-auto"
                 style={{ background: "var(--surface-raised)", border: "1px solid var(--divider)", boxShadow: "0 8px 24px color-mix(in srgb, var(--ink) 12%, transparent)" }}>
                 {filteredNotes.map((s, i) => (
                   <div key={i} 
                     onClick={() => { setNote(s); setShowNoteSuggestions(false); }}
                     className="px-4 py-3 border-b border-[var(--divider)] last:border-b-0 active:bg-ink/5 cursor-pointer text-[var(--ink)] transition-colors"
                     style={{ fontSize: 13.5 }}>
                     {renderHighlightedNote(s, note)}
                   </div>
                 ))}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* ── Category Section (Income/Expense only) ── */}
        {txType !== "transfer" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mx-4 mb-2">
               <p className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] m-0">Category</p>
               {catId && (
                  <button onClick={resetCat}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-[10px]"
                    style={{ background: "var(--divider)", fontSize: 10, color: "color-mix(in srgb, var(--ink) 45%, transparent)" }}>
                    <X className="w-2.5 h-2.5" /> Clear
                  </button>
                )}
            </div>
            {errors.cat && (
              <p className="px-4 text-rose-400 mb-1" style={{ fontSize: 11 }}>{errors.cat}</p>
            )}
            
            {/* Horizontal Scroll Categories */}
            <div className="flex overflow-x-auto gap-2 px-4 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style dangerouslySetInnerHTML={{__html: \`::-webkit-scrollbar { display: none; }\`}} />
              {cats.map(c => {
                const isSel = catId === c.id;
                return (
                  <motion.button key={c.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      if (catId === c.id) { setShowSubSheet(true); return; }
                      setCatId(c.id); setSubId(null); setErrors(e => ({ ...e, cat: undefined! }));
                      setShowSubSheet(true);
                    }}
                    className="bg-[var(--surface)] rounded-[14px] p-2.5 flex flex-col items-center gap-2 flex-shrink-0 w-[72px]"
                    style={{
                      background: isSel ? \`\${typeAccent}33\` : "var(--surface)",
                      boxShadow: isSel ? \`inset 0 0 0 1.5px \${typeAccent}\` : "none",
                    }}>
                    <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
                       style={{
                          background: isSel ? \`\${typeAccent}25\` : "var(--surface-raised)",
                          color: isSel ? typeAccent : "var(--ink-muted)"
                       }}>
                      {c.icon ? <c.icon className="w-4 h-4" /> : <span style={{ fontSize: 16 }}>{c.emoji}</span>}
                    </div>
                    <span className="text-[10px] text-center leading-[1.2]" style={{ color: isSel ? "var(--ink)" : "var(--ink-muted)" }}>
                      {c.name.replace(" &", "").replace(" and", "").replace("& ", "").slice(0, 10)}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected subcategory display */}
            <AnimatePresence>
              {catId && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                  className="px-4 mt-2 overflow-hidden">
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[12px]"
                    style={{
                      background: selectedCat ? \`\${selectedCat.color}10\` : "color-mix(in srgb, var(--ink) 5%, transparent)",
                      border: \`1px solid \${selectedCat?.color ?? "#fff"}22\`,
                    }}>
                      {selectedCat?.icon ? <selectedCat.icon className="w-4 h-4" style={{ color: selectedCat.color }} /> : <span style={{ fontSize: 14 }}>{selectedCat?.emoji}</span>}
                      <div className="flex-1 ml-1">
                        <div className="flex items-baseline gap-2">
                           <p className="text-ink font-semibold m-0" style={{ fontSize: 12 }}>{selectedCat?.name}</p>
                           {subId && <span className="text-ink/60 m-0" style={{ fontSize: 11 }}>→ {selectedSub?.name}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-ink/30" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Grid: Account & Date ── */}
        <div className="grid grid-cols-2 gap-3 mx-4 mb-4">
           {/* Account */}
           <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowAccSheet(true)}
              className="rounded-[14px] p-3 flex items-center gap-2.5 text-left"
              style={{
                 background: \`\${typeAccent}25\`,
                 border: errors.acc ? "1px solid #EF4444" : "none"
              }}>
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,0,0,0.2)", color: typeAccent }}>
                 {(() => {
                   const AccIcon = getAccountIcon(selectedAcc.type);
                   return <AccIcon className="w-[14px] h-[14px]" />;
                 })()}
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="m-0 text-[11.5px] font-medium text-[var(--ink)] truncate">{selectedAcc.name}</p>
                 <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: typeAccent }}>₹{Math.abs(selectedAcc.balance).toLocaleString("en-IN")}</span>
              </div>
           </motion.button>

           {/* Date & Time */}
           <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowDate(true)}
              className="bg-[var(--surface)] rounded-[14px] p-3 flex items-center gap-2.5">
              <div className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "var(--orange-bg)", color: "var(--orange)" }}>
                 <Calendar className="w-[14px] h-[14px]" />
              </div>
              <div className="flex-1 overflow-hidden text-left">
                 <p className="m-0 text-[11.5px] text-[var(--ink-muted)]">Date & time</p>
                 <span className="text-[11.5px] font-medium text-[var(--ink)] truncate block">{fmtDate(date)}</span>
              </div>
           </motion.button>
        </div>

        {errors.acc && <p className="text-rose-400 mt-0.5 mb-2 px-5" style={{ fontSize: 11 }}>{errors.acc}</p>}

        {/* ── Transfer To Account (replaces Date in the grid layout if transfer, or adds new row) ── */}
        {txType === "transfer" && (
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowToAcc(true)}
             className="mx-4 mb-4 rounded-[14px] p-3 flex items-center gap-2.5 text-left w-[calc(100%-32px)]"
             style={{
                background: selectedTo ? \`\${selectedTo.color}25\` : "color-mix(in srgb, var(--ink) 5%, transparent)",
                border: errors.toAcc ? "1px solid #EF4444" : "none"
             }}>
             {selectedTo ? (
                <>
                   <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,0,0,0.2)", color: selectedTo.color }}>
                      {(() => {
                        const ToAccIcon = getAccountIcon(selectedTo.type);
                        return <ToAccIcon className="w-[14px] h-[14px]" />;
                      })()}
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <p className="m-0 text-[12px] font-medium text-[var(--ink)] truncate">To: {selectedTo.name}</p>
                      <span className="text-[12px] font-semibold tabular-nums" style={{ color: selectedTo.color }}>₹{Math.abs(selectedTo.balance).toLocaleString("en-IN")}</span>
                   </div>
                   <ChevronDown className="w-[14px] h-[14px] ml-2" style={{ color: selectedTo.color }} strokeWidth={1.75} />
                </>
             ) : (
                <>
                   <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--divider)", color: "var(--ink-muted)" }}>
                      <Plus className="w-[14px] h-[14px]" />
                   </div>
                   <p className="flex-1 m-0 text-[13px] font-medium text-[var(--ink-muted)]">Select destination account</p>
                </>
             )}
          </motion.button>
        )}

        {/* ── Spacer to push actions to bottom ── */}
        <div className="flex-1 min-h-[8px]" />

        {/* ── Compact Action Row (Attachments, Recurring, AI) ── */}
        <div className="flex gap-2.5 mx-4 mb-4 mt-2">
           {/* Scan AI (Primary secondary action) */}
           <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAIScan}
              disabled={aiScanning}
              className="flex-[2] rounded-[14px] py-3.5 flex items-center justify-center gap-2 text-[13.5px] font-semibold text-[#241B0A]"
              style={{ background: "linear-gradient(135deg, var(--gold), #E8B86B)" }}>
              {aiScanning ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 rounded-full border-2 border-[#241B0A]/30 border-t-[#241B0A]" />
              ) : (
                <>
                   <Sparkles className="w-[14px] h-[14px] stroke-[#241B0A]" />
                   Scan Receipt
                </>
              )}
           </motion.button>
           
           {/* Camera / Gallery mini buttons */}
           <div className="flex gap-2 flex-1">
             <motion.button whileTap={{ scale: 0.96 }}
                className="flex-1 bg-[var(--surface)] rounded-[14px] flex items-center justify-center text-[var(--ink-muted)]">
                <Camera className="w-[15px] h-[15px]" />
             </motion.button>
             <motion.button whileTap={{ scale: 0.96 }}
                className="flex-1 bg-[var(--surface)] rounded-[14px] flex items-center justify-center text-[var(--ink-muted)]">
                <ImageIcon className="w-[15px] h-[15px]" />
             </motion.button>
           </div>
           
           {/* Recurring Mini Toggle */}
           <motion.button whileTap={{ scale: 0.96 }} onClick={() => setRecurring(!recurring)}
              className="px-4 bg-[var(--surface)] rounded-[14px] flex items-center justify-center transition-colors"
              style={{ color: recurring ? "var(--gold)" : "var(--ink-muted)", border: recurring ? "1px solid var(--gold)" : "1px solid transparent" }}>
              <Repeat className="w-[15px] h-[15px]" />
           </motion.button>
        </div>

        <AnimatePresence>
          {recurring && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 mb-4 overflow-hidden">
              <div className="p-3.5 rounded-[14px]" style={{ background: "var(--surface)", border: \`1px solid \${typeAccent}30\` }}>
                <p className="text-ink/60 font-semibold mb-2.5" style={{ fontSize: 11, letterSpacing: "0.5px" }}>RECURRING SETTINGS</p>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-ink" style={{ fontSize: 13 }}>Frequency</span>
                    <select
                      value={recurFreq} onChange={e => setRecurFreq(e.target.value as any)}
                      className="bg-transparent text-right font-semibold focus:outline-none"
                      style={{ fontSize: 13, color: typeAccent }}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="half-yearly">Half-yearly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="h-px bg-ink/5" />
                  <div className="flex items-center justify-between">
                    <span className="text-ink" style={{ fontSize: 13 }}>Ends</span>
                    <select
                      value={recurEndType} onChange={e => setRecurEndType(e.target.value as any)}
                      className="bg-transparent text-right font-semibold focus:outline-none"
                      style={{ fontSize: 13, color: typeAccent }}>
                      <option value="never">Never</option>
                      <option value="date">On Date</option>
                    </select>
                  </div>
                  {recurEndType === "date" && (
                    <button onClick={() => setShowRecurEndDate(true)}
                      className="w-full text-right mt-1" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                      Selected: {fmtDate(recurEndDate)}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Save Button ── */}
        <div className="mx-4 mt-2 mb-2">
           <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="w-full rounded-[16px] py-4 flex items-center justify-center gap-2 text-[15px] font-semibold"
              style={{ background: typeAccent, color: "#241310" }}>
              <Check className="w-[15px] h-[15px]" style={{ stroke: "#241310" }} strokeWidth={2.5} />
              Save Transaction
           </motion.button>
        </div>

      </div>

      {/* ── Modals / Overlays ── */}
      <AnimatePresence>
        {showCalc && <CalcModal key="calc" value={amount} onChange={setAmount} onClose={() => setShowCalc(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSubSheet && selectedCat && (
          <SubcategorySheet
            key="sub"
            cat={selectedCat}
            selectedSubId={subId}
            onSelect={s => setSubId(s.id)}
            onClose={() => setShowSubSheet(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAccSheet && (
          <AccountSheet
            accounts={ACCOUNTS}
            selected={accId} onSelect={a => setAccId(a.id)}
            onClose={() => setShowAccSheet(false)}
            excludeId={txType === "transfer" ? toAccId : undefined} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showToAcc && (
          <AccountSheet
            accounts={ACCOUNTS}
            selected={toAccId} onSelect={a => setToAccId(a.id)}
            onClose={() => setShowToAcc(false)}
            excludeId={accId} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDate && <DatePickerModal key="tx-date" date={date} onSelect={setDate} onClose={() => setShowDate(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showRecurEndDate && (
          <DatePickerModal key="recur-end-date" date={recurEndDate} onSelect={setRecurEndDate} onClose={() => setShowRecurEndDate(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {saved && <SuccessOverlay key="success" txType={txType} onDone={() => navigate("/dashboard/transactions")} />}
      </AnimatePresence>
      <input
        type="file"
        id="receipt-file-input"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelection}
      />

    </div>
  );
}
`;

content = beforeReturn + newReturnJSX;

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully adjusted AddTransactionScreen layout vertically.");
