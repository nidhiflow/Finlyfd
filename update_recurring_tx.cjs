const fs = require('fs');

const FILE_PATH = 'e:/Finly-development/Finlyfd-main/src/app/screens/RecurringTransactionsScreen.tsx';
let code = fs.readFileSync(FILE_PATH, 'utf8');

// Update RecurringTransaction interface
const interfaceRegex = /interface RecurringTransaction \{[\s\S]*?\}/;
const newInterface = `interface RecurringTransaction {
  id: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  categoryId: string | null;
  subcategoryId: string | null;
  accountId: string;
  toAccountId: string | null;
  note: string;
  frequency: string;
  interval?: number;
  startDate: string;
  nextDueDate: string | null;
  endType: string;
  endDate: string | null;
  endCount: number | null;
  occurrenceCount: number;
  status: "active" | "paused" | "completed" | "expired";
  createdAt: string;
}`;
if (!code.includes('interval?: number')) {
  code = code.replace(interfaceRegex, newInterface);
}

// Update loadRecurring mapping
const mappingRegex = /frequency: t\.repeat_frequency.*?occurrenceCount: 0,/s;
const newMapping = `frequency: t.repeat_frequency || "monthly",
        interval: t.repeat_interval || 1,
        startDate: t.date,
        nextDueDate: t.next_due_date || t.date,
        endType: t.repeat_end_type || "never",
        endDate: t.repeat_end_date || null,
        endCount: t.repeat_occurrences_total || null,
        occurrenceCount: t.repeat_occurrences_current || 0,`;
if (!code.includes('interval: t.repeat_interval')) {
  code = code.replace(mappingRegex, newMapping);
}

// Update formatFrequency and getRepeatText
const formatFreqRegex = /const formatFrequency = .*?return "";\s*\};/s;
const newFormatFreq = `const formatFrequency = (freq: string, interval: number = 1) => {
    if (interval > 1) return \`Every \${interval} \${freq.replace('ly', '')}s\`;
    if (freq === "half-yearly") return "Half-Yearly";
    if (freq === "quarterly") return "Quarterly";
    if (freq === "days") return "Daily";
    if (freq === "weeks") return "Weekly";
    if (freq === "months") return "Monthly";
    if (freq === "years") return "Yearly";
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  };

  const getRepeatText = (rec: RecurringTransaction) => {
    const start = new Date(rec.startDate);
    const day = start.getDate();
    const dayOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][start.getDay()];
    const int = rec.interval || 1;

    if (rec.frequency === "daily" || rec.frequency === "days") return int > 1 ? \`Every \${int} days\` : "Every day";
    if (rec.frequency === "weekly" || rec.frequency === "weeks") return int > 1 ? \`Every \${int} weeks on \${dayOfWeek}\` : \`Every \${dayOfWeek}\`;
    if (rec.frequency === "monthly" || rec.frequency === "months") return int > 1 ? \`Every \${int} months on \${day}\${day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}\` : \`\${day}\${day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of every month\`;
    if (rec.frequency === "quarterly") return \`\${day}\${day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} every 3 months\`;
    if (rec.frequency === "half-yearly") return \`\${day}\${day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} every 6 months\`;
    if (rec.frequency === "yearly" || rec.frequency === "years") return int > 1 ? \`Every \${int} years on \${day} \${MONTHS_SHORT[start.getMonth()]}\` : \`\${day} \${MONTHS_SHORT[start.getMonth()]} every year\`;
    return "Custom schedule";
  };

  const getEndText = (rec: RecurringTransaction) => {
    if (rec.endType === "never") return "No end date";
    if (rec.endType === "on_date" && rec.endDate) {
      const end = new Date(rec.endDate);
      return \`Until \${MONTHS_SHORT[end.getMonth()]} \${end.getFullYear()}\`;
    }
    if (rec.endType === "after_n") {
      return \`\${rec.occurrenceCount}/\${rec.endCount} times\`;
    }
    return "";
  };`;

// Note: the string above has template literals escaped manually for the AST or by standard Javascript semantics where \` prevents interpolation, but \${...} still interpolates. So I need to use string concatenation or escape $.

const newFormatFreqFixed = "const formatFrequency = (freq: string, interval: number = 1) => {\n" +
"    if (interval > 1) return `Every ${interval} ${freq.replace('ly', '')}s`;\n" +
"    if (freq === 'half-yearly') return 'Half-Yearly';\n" +
"    if (freq === 'quarterly') return 'Quarterly';\n" +
"    if (freq === 'days') return 'Daily';\n" +
"    if (freq === 'weeks') return 'Weekly';\n" +
"    if (freq === 'months') return 'Monthly';\n" +
"    if (freq === 'years') return 'Yearly';\n" +
"    return freq.charAt(0).toUpperCase() + freq.slice(1);\n" +
"  };\n\n" +
"  const getRepeatText = (rec: RecurringTransaction) => {\n" +
"    const start = new Date(rec.startDate);\n" +
"    const day = start.getDate();\n" +
"    const dayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][start.getDay()];\n" +
"    const int = rec.interval || 1;\n\n" +
"    if (rec.frequency === 'daily' || rec.frequency === 'days') return int > 1 ? `Every ${int} days` : 'Every day';\n" +
"    if (rec.frequency === 'weekly' || rec.frequency === 'weeks') return int > 1 ? `Every ${int} weeks on ${dayOfWeek}` : `Every ${dayOfWeek}`;\n" +
"    if (rec.frequency === 'monthly' || rec.frequency === 'months') return int > 1 ? `Every ${int} months on ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}` : `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of every month`;\n" +
"    if (rec.frequency === 'quarterly') return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} every 3 months`;\n" +
"    if (rec.frequency === 'half-yearly') return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} every 6 months`;\n" +
"    if (rec.frequency === 'yearly' || rec.frequency === 'years') return int > 1 ? `Every ${int} years on ${day} ${MONTHS_SHORT[start.getMonth()]}` : `${day} ${MONTHS_SHORT[start.getMonth()]} every year`;\n" +
"    return 'Custom schedule';\n" +
"  };\n\n" +
"  const getEndText = (rec: RecurringTransaction) => {\n" +
"    if (rec.endType === 'never') return 'No end date';\n" +
"    if (rec.endType === 'on_date' && rec.endDate) {\n" +
"      const end = new Date(rec.endDate);\n" +
"      return `Until ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;\n" +
"    }\n" +
"    if (rec.endType === 'after_n') {\n" +
"      return `${rec.occurrenceCount}/${rec.endCount} times`;\n" +
"    }\n" +
"    return '';\n" +
"  };";

if (!code.includes('if (interval > 1)')) {
  code = code.replace(formatFreqRegex, newFormatFreqFixed);
}

fs.writeFileSync(FILE_PATH, code);
console.log('Successfully updated RecurringTransactionsScreen.tsx');
