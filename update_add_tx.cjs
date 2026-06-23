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
    <div className="relative" style={{ background: "var(--bg-deep)", minHeight: "100vh" }}>
      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 pointer-events-none"
        style={{ background: \`radial-gradient(ellipse at 50% 0%,\${typeAccent}14 0%,transparent 70%)\`, transition: "background 0.4s" }} />

      <div className="relative z-10 pb-36">

        {/* ── Type Toggle ── */}
        <div className="flex gap-2 mx-5 mb-5 bg-[var(--surface)] rounded-[14px] p-1.5 mt-4">
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
        <div className="mx-5 mb-[22px] bg-[var(--surface)] rounded-[18px] p-5 pb-[22px]">
          <div className="flex justify-between items-center mb-3.5">
            <p className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] m-0">
              {txType === "income" ? "INCOME AMOUNT" : txType === "transfer" ? "TRANSFER AMOUNT" : "EXPENSE AMOUNT"}
            </p>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCalc(true)}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-[20px]"
              style={{
                 color: typeAccent,
                 background: \`\${typeAccent}25\`
              }}>
              <Calculator className="w-[13px] h-[13px]" style={{ color: typeAccent }} />
              Calculator
            </motion.button>
          </div>
          <div className="flex items-baseline gap-1.5 font-fraunces font-medium text-[40px]" style={{ color: typeAccent }}>
            <span className="text-[24px] text-[var(--ink-faint)]">₹</span>
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
            <p className="text-rose-400 mt-2" style={{ fontSize: 12 }}>{errors.amount}</p>
          )}
        </div>

        {/* ── Category Section (Income/Expense only) ── */}
        {txType !== "transfer" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mx-5 mb-3">
               <p className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] m-0">Category</p>
               {catId && (
                  <button onClick={resetCat}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl"
                    style={{ background: "var(--divider)", fontSize: 11, color: "color-mix(in srgb, var(--ink) 45%, transparent)" }}>
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
            </div>
            {errors.cat && (
              <p className="px-5 text-rose-400 mb-2" style={{ fontSize: 12 }}>{errors.cat}</p>
            )}
            <div className="grid grid-cols-4 gap-2.5 mx-5 mb-6">
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
                    className="bg-[var(--surface)] rounded-[14px] pt-3.5 px-1 pb-2.5 flex flex-col items-center gap-2"
                    style={{
                      background: isSel ? \`\${typeAccent}33\` : "var(--surface)",
                      boxShadow: isSel ? \`inset 0 0 0 1.5px \${typeAccent}\` : "none",
                    }}>
                    <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center"
                       style={{
                          background: isSel ? \`\${typeAccent}25\` : "var(--surface-raised)",
                          color: isSel ? typeAccent : "var(--ink-muted)"
                       }}>
                      {c.icon ? <c.icon className="w-4 h-4" /> : <span style={{ fontSize: 16 }}>{c.emoji}</span>}
                    </div>
                    <span className="text-[10.5px] text-center leading-[1.3]" style={{ color: isSel ? "var(--ink)" : "var(--ink-muted)" }}>
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
                  className="px-5 mt-3 overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                    style={{
                      background: selectedCat ? \`\${selectedCat.color}10\` : "color-mix(in srgb, var(--ink) 5%, transparent)",
                      border: \`1px solid \${selectedCat?.color ?? "#fff"}22\`,
                    }}>
                      {selectedCat?.icon ? <selectedCat.icon className="w-6 h-6" style={{ color: selectedCat.color }} /> : <span style={{ fontSize: 18 }}>{selectedCat?.emoji}</span>}
                      <div className="flex-1">
                        <p className="text-ink font-semibold" style={{ fontSize: 13 }}>{selectedCat?.name}</p>
                        {subId ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: selectedCat?.color }} />
                            <p className="text-ink/60" style={{ fontSize: 11 }}>{selectedSub?.name}</p>
                          </div>
                        ) : (
                          <p className="text-ink/40" style={{ fontSize: 11 }}>Tap to select subcategory</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink/30" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Account Selection ── */}
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowAccSheet(true)}
           className="mx-5 mb-[22px] rounded-[16px] px-4 py-3.5 flex items-center gap-3 text-left w-[calc(100%-40px)]"
           style={{
              background: \`\${typeAccent}33\`,
              border: errors.acc ? "1px solid #EF4444" : "none"
           }}>
           <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,0,0,0.2)", color: typeAccent }}>
              {(() => {
                const AccIcon = getAccountIcon(selectedAcc.type);
                return <AccIcon className="w-5 h-5" />;
              })()}
           </div>
           <div className="flex-1">
              <p className="m-0 text-[14px] font-medium text-[var(--ink)]">{selectedAcc.name}</p>
              <p className="m-0 mt-0.5 text-[11.5px] text-[var(--ink-muted)]">{selectedAcc.type}</p>
           </div>
           <span className="text-[14px] font-semibold tabular-nums" style={{ color: typeAccent }}>₹{Math.abs(selectedAcc.balance).toLocaleString("en-IN")}</span>
           <ChevronDown className="w-[14px] h-[14px] ml-2" style={{ color: typeAccent }} strokeWidth={1.75} />
        </motion.button>
        {errors.acc && <p className="text-rose-400 mt-1.5 px-6" style={{ fontSize: 12 }}>{errors.acc}</p>}

        {/* ── Transfer To Account ── */}
        {txType === "transfer" && (
          <>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowToAcc(true)}
               className="mx-5 mb-[22px] rounded-[16px] px-4 py-3.5 flex items-center gap-3 text-left w-[calc(100%-40px)]"
               style={{
                  background: selectedTo ? \`\${selectedTo.color}25\` : "color-mix(in srgb, var(--ink) 5%, transparent)",
                  border: errors.toAcc ? "1px solid #EF4444" : "none"
               }}>
               {selectedTo ? (
                  <>
                     <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,0,0,0.2)", color: selectedTo.color }}>
                        {(() => {
                          const ToAccIcon = getAccountIcon(selectedTo.type);
                          return <ToAccIcon className="w-5 h-5" />;
                        })()}
                     </div>
                     <div className="flex-1">
                        <p className="m-0 text-[14px] font-medium text-[var(--ink)]">{selectedTo.name}</p>
                        <p className="m-0 mt-0.5 text-[11.5px] text-[var(--ink-muted)]">{selectedTo.type}</p>
                     </div>
                     <span className="text-[14px] font-semibold tabular-nums" style={{ color: selectedTo.color }}>₹{Math.abs(selectedTo.balance).toLocaleString("en-IN")}</span>
                     <ChevronDown className="w-[14px] h-[14px] ml-2" style={{ color: selectedTo.color }} strokeWidth={1.75} />
                  </>
               ) : (
                  <>
                     <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--divider)", color: "var(--ink-muted)" }}>
                        <Plus className="w-5 h-5" />
                     </div>
                     <p className="flex-1 m-0 text-[14px] font-medium text-[var(--ink-muted)]">Select destination account</p>
                     <ChevronDown className="w-[14px] h-[14px] ml-2 text-[var(--ink-muted)]" strokeWidth={1.75} />
                  </>
               )}
            </motion.button>
            {errors.toAcc && <p className="text-rose-400 mt-1.5 px-6" style={{ fontSize: 12 }}>{errors.toAcc}</p>}
          </>
        )}
        
        {/* ── Date & Time ── */}
        <p className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] m-0 mx-5 mb-3">Date & time</p>
        <div className="mx-5 mb-[18px]">
           <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowDate(true)}
              className="w-full bg-[var(--surface)] rounded-[14px] px-4 py-3 flex items-center gap-3">
              <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: "var(--orange-bg)", color: "var(--orange)" }}>
                 <Calendar className="w-[15px] h-[15px]" />
              </div>
              <span className="flex-1 text-[13.5px] text-left text-[var(--ink)]">{fmtDate(date)}</span>
              <ChevronDown className="w-[14px] h-[14px] text-[var(--ink-faint)]" />
           </motion.button>
        </div>

        {/* ── Note ── */}
        <p className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] m-0 mx-5 mb-3">Note</p>
        <div className="mx-5 mb-[22px] bg-[var(--surface)] rounded-[14px] p-4 relative z-20">
           <textarea
              value={note}
              onChange={e => { setNote(e.target.value); setShowNoteSuggestions(true); }}
              onFocus={() => setShowNoteSuggestions(true)}
              onBlur={() => setTimeout(() => setShowNoteSuggestions(false), 200)}
              rows={2} placeholder="Add a note..."
              className="w-full bg-transparent border-none text-[var(--ink)] font-inter text-[13.5px] resize-none outline-none placeholder:text-[var(--ink-faint)]"
           />
           <AnimatePresence>
             {showNoteSuggestions && note.length > 0 && filteredNotes.length > 0 && (
               <motion.div
                 initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                 className="absolute top-full left-0 right-0 mt-2 rounded-[14px] overflow-hidden z-50 max-h-48 overflow-y-auto"
                 style={{ background: "var(--surface)", border: "1px solid var(--divider)", boxShadow: "0 8px 24px color-mix(in srgb, var(--ink) 12%, transparent)" }}>
                 {filteredNotes.map((s, i) => (
                   <div key={i} 
                     onClick={() => { setNote(s); setShowNoteSuggestions(false); }}
                     className="px-4 py-3.5 border-b border-[var(--divider)] last:border-b-0 active:bg-ink/5 cursor-pointer text-[var(--ink)] transition-colors"
                     style={{ fontSize: 13.5 }}>
                     {renderHighlightedNote(s, note)}
                   </div>
                 ))}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* ── Attachments ── */}
        <p className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] m-0 mx-5 mb-3">Attachments</p>
        <div className="flex gap-3 mx-5 mb-[22px]">
           <motion.button whileTap={{ scale: 0.96 }}
              className="flex-1 bg-[var(--surface)] rounded-[14px] py-3.5 flex items-center justify-center gap-2 text-[13px] text-[var(--ink-muted)]">
              <Camera className="w-[15px] h-[15px]" /> Camera
           </motion.button>
           <motion.button whileTap={{ scale: 0.96 }}
              className="flex-1 bg-[var(--surface)] rounded-[14px] py-3.5 flex items-center justify-center gap-2 text-[13px] text-[var(--ink-muted)]">
              <ImageIcon className="w-[15px] h-[15px]" /> Gallery
           </motion.button>
        </div>

        {/* ── AI Scan ── */}
        <div className="mx-5 mb-[22px]">
           <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAIScan}
              disabled={aiScanning}
              className="w-full rounded-[14px] py-3.5 flex items-center justify-center gap-2 text-[13.5px] font-semibold text-[#241B0A]"
              style={{ background: "linear-gradient(135deg, var(--gold), #E8B86B)" }}>
              {aiScanning ? (
                <>
                   <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 rounded-full border-2 border-[#241B0A]/30 border-t-[#241B0A]" />
                   <span>Scanning Receipt…</span>
                </>
              ) : (
                <>
                   <Sparkles className="w-[15px] h-[15px] stroke-[#241B0A]" />
                   Scan Receipt with AI
                </>
              )}
           </motion.button>
        </div>

        {/* ── Recurring ── */}
        <div className="mx-5 mb-6 bg-[var(--surface)] rounded-[14px] p-3.5 px-4 flex items-center gap-3">
           <div className="w-[32px] h-[32px] rounded-[9px] bg-[var(--surface-raised)] flex items-center justify-center flex-shrink-0 text-[var(--ink-muted)]">
              <Repeat className="w-4 h-4" />
           </div>
           <div className="flex-1">
              <p className="m-0 text-[13.5px] font-medium text-[var(--ink)]">Recurring transaction</p>
              <p className="m-0 mt-[2px] text-[11.5px] text-[var(--ink-faint)]">Automate this transaction</p>
           </div>
           <div onClick={() => setRecurring(!recurring)} className="relative w-[42px] h-[24px] rounded-[14px] flex-shrink-0 cursor-pointer transition-colors" style={{ background: recurring ? "var(--gold)" : "var(--surface-raised)" }}>
              <motion.div className="absolute top-[3px] w-[18px] h-[18px] rounded-full"
                 animate={{ left: recurring ? 21 : 3 }}
                 style={{ background: recurring ? "#241B0A" : "var(--ink-faint)" }} />
           </div>
        </div>

        <AnimatePresence>
          {recurring && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 mb-6 overflow-hidden">
              <div className="p-4 rounded-[16px]" style={{ background: "var(--surface)", border: \`1px solid \${typeAccent}30\` }}>
                <p className="text-ink/60 font-semibold mb-3" style={{ fontSize: 11, letterSpacing: "0.5px" }}>RECURRING SETTINGS</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-ink" style={{ fontSize: 14 }}>Frequency</span>
                    <select
                      value={recurFreq} onChange={e => setRecurFreq(e.target.value as any)}
                      className="bg-transparent text-right font-semibold focus:outline-none"
                      style={{ fontSize: 14, color: typeAccent }}>
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
                    <span className="text-ink" style={{ fontSize: 14 }}>Ends</span>
                    <select
                      value={recurEndType} onChange={e => setRecurEndType(e.target.value as any)}
                      className="bg-transparent text-right font-semibold focus:outline-none"
                      style={{ fontSize: 14, color: typeAccent }}>
                      <option value="never">Never</option>
                      <option value="date">On Date</option>
                    </select>
                  </div>
                  {recurEndType === "date" && (
                    <button onClick={() => setShowRecurEndDate(true)}
                      className="w-full text-right mt-1" style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                      Selected: {fmtDate(recurEndDate)}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Save Button ── */}
        <div className="mx-5 mb-1.5">
           <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="w-full rounded-[16px] py-4 flex items-center justify-center gap-2 text-[14.5px] font-semibold"
              style={{ background: typeAccent, color: "#241310" }}>
              <Check className="w-[15px] h-[15px]" style={{ stroke: "#241310" }} strokeWidth={2.5} />
              Save Transaction
           </motion.button>
        </div>

      </div>

      {/* ── Modals / Overlays ── */}
      <AnimatePresence>
        {showCalc && <CalculatorModal value={amount} onSelect={v => { setAmount(v); setShowCalc(false); }} onClose={() => setShowCalc(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSubSheet && selectedCat && (
          <SubcategorySheet
            cat={selectedCat}
            selectedId={subId}
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
console.log("Successfully replaced the AddTransactionScreen return block.");
