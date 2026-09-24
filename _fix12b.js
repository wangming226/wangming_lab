const fs = require('fs');
let s = fs.readFileSync('js/data/site-data.js', 'utf8');

const targetIds = ['paper-28','paper-30','paper-33','paper-34','paper-35','paper-38','paper-41','paper-46','paper-51','paper-53','paper-57','paper-58'];

function fixRunOn(str) {
  // Protect chemical formulas: Zn(II) etc
  let p = str.replace(/([A-Z][a-z]?\(I{1,3}|IV|VI\))/g, function(m) {
    return '«' + m + '»';
  });
  // Insert space between [a-z)] and [A-Z]
  p = p.replace(/([a-z)])([A-Z])/g, '$1 $2');
  // Restore
  p = p.replace(/«([^»]+)»/g, '$1');
  // Collapse multiple spaces
  p = p.replace(/ {2,}/g, ' ');
  return p;
}

let fixed = 0;
targetIds.forEach(function(id) {
  // Find the position of this paper in the file
  let searchStr = 'id: "' + id + '"';
  let idx = s.indexOf(searchStr);
  if (idx === -1) { console.log(id + ': NOT FOUND'); return; }
  
  // Find the en abstract: "abstract": "..." 
  let absStart = s.indexOf('"abstract": "', idx);
  if (absStart === -1) { console.log(id + ': no abstract'); return; }
  absStart += 13; // skip past "abstract": "
  let absEnd = s.indexOf('"', absStart);
  // Handle escaped quotes - find the real end
  let searchFrom = absStart;
  while (true) {
    absEnd = s.indexOf('"', searchFrom);
    if (absEnd === -1) break;
    if (s[absEnd-1] !== '\') break;
    searchFrom = absEnd + 1;
  }
  
  let oldAbs = s.substring(absStart, absEnd);
  let newAbs = fixRunOn(oldAbs);
  
  if (newAbs !== oldAbs) {
    s = s.substring(0, absStart) + newAbs + s.substring(absEnd);
    fixed++;
    // Count changes
    let diff = oldAbs.length - newAbs.length;
    console.log(id + ': fixed (' + (diff >= 0 ? '+' : '') + (-diff) + ' spaces added)');
  } else {
    console.log(id + ': no changes needed');
  }
});

fs.writeFileSync('js/data/site-data.js', s, 'utf8');
console.log('Fixed ' + fixed + ' papers');
