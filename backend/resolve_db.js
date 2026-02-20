const dns = require('dns');
console.log('Resolving db.dhizxlncgkbvcrmdqixl.supabase.co...');
dns.resolve4('db.dhizxlncgkbvcrmdqixl.supabase.co', (err, addresses) => {
  if (err) console.log('IPv4 Error:', err.message);
  else console.log('IPv4:', addresses);
});
dns.resolve6('db.dhizxlncgkbvcrmdqixl.supabase.co', (err, addresses) => {
  if (err) console.log('IPv6 Error:', err.message);
  else console.log('IPv6:', addresses);
});
