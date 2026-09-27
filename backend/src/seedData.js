import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { Post } from './models/Post.js';
import { Pool } from './models/Pool.js';
import { Transaction } from './models/Transaction.js';

const rs = (n) => n * 100; // rupees -> paise

export async function seedInto() {
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Post.deleteMany({}),
    Pool.deleteMany({}),
    Transaction.deleteMany({}),
  ]);

  const seller = await User.create({
    phone: '9812345678', name: 'Sunita Devi', city: 'Gorakhpur', role: 'seller', language: 'hi', verified: true,
  });
  const referrer = await User.create({
    phone: '9823456789', name: 'Ramesh Yadav', city: 'Jhansi', language: 'hi', verified: true, walletBalance: rs(250),
  });
  const buyer = await User.create({
    phone: '9834567890', name: 'Anjali Kumari', city: 'Jhansi', language: 'hi', verified: true,
    walletBalance: rs(2000), referredBy: referrer._id,
  });

  const products = await Product.insertMany([
    {
      title: 'Handloom Cotton Saree', titleHi: 'हथकरघा सूती साड़ी',
      description: 'Locally woven, 6 metres, natural dye.',
      descriptionHi: 'स्थानीय रूप से बुनी गई, 6 मीटर, प्राकृतिक रंग।',
      price: rs(899), mrp: rs(1299), category: 'fashion', stock: 24, seller: seller._id,
      city: 'Gorakhpur', rating: 4.5, ratingCount: 38, cashbackPercent: 3,
      images: ['https://picsum.photos/seed/saree/600/600'],
    },
    {
      title: 'Organic Mustard Oil 1L', titleHi: 'जैविक सरसों का तेल 1 लीटर',
      description: 'Cold-pressed at a village ghani.',
      descriptionHi: 'गाँव की घानी में ठंडा दबाया हुआ।',
      price: rs(210), mrp: rs(260), category: 'grocery', stock: 120, seller: seller._id,
      city: 'Gorakhpur', rating: 4.7, ratingCount: 91, cashbackPercent: 2,
      images: ['https://picsum.photos/seed/oil/600/600'],
    },
    {
      title: 'Solar LED Lantern', titleHi: 'सोलर एलईडी लालटेन',
      description: '8 hours of light on a full charge.',
      descriptionHi: 'पूरा चार्ज होने पर 8 घंटे की रोशनी।',
      price: rs(649), mrp: rs(899), category: 'electronics', stock: 40, seller: seller._id,
      city: 'Jhansi', rating: 4.2, ratingCount: 17, cashbackPercent: 5,
      images: ['https://picsum.photos/seed/lantern/600/600'],
    },
    {
      title: 'Brass Puja Thali Set', titleHi: 'पीतल की पूजा थाली सेट',
      price: rs(1150), mrp: rs(1500), category: 'home', stock: 12, seller: seller._id,
      city: 'Gorakhpur', rating: 4.8, ratingCount: 22, cashbackPercent: 2,
      images: ['https://picsum.photos/seed/thali/600/600'],
    },
    {
      title: 'Desi Gir Cow Ghee 500g', titleHi: 'देसी गिर गाय का घी 500 ग्राम',
      price: rs(750), mrp: rs(950), category: 'farm', stock: 30, seller: seller._id,
      city: 'Jhansi', rating: 4.9, ratingCount: 64, cashbackPercent: 4,
      images: ['https://picsum.photos/seed/ghee/600/600'],
    },
  ]);

  await Post.insertMany([
    {
      author: seller._id,
      text: 'New handloom sarees just arrived from our weaving group. 12 women worked on this batch!',
      taggedProducts: [products[0]._id],
      images: ['https://picsum.photos/seed/post1/800/600'],
      likes: [buyer._id, referrer._id],
      comments: [{ author: buyer._id, text: 'Colour bahut sundar hai 😍' }],
      shareCount: 4,
    },
    {
      author: referrer._id,
      text: 'घर की घानी का सरसों तेल — एक बार इस्तेमाल करके देखिए, स्वाद अलग है।',
      taggedProducts: [products[1]._id],
      likes: [buyer._id],
      shareCount: 9,
    },
    {
      author: buyer._id,
      text: 'Solar lantern worked through the whole power cut last night. Worth it.',
      taggedProducts: [products[2]._id],
      images: ['https://picsum.photos/seed/post3/800/600'],
      shareCount: 2,
    },
  ]);

  // A real pool has thousands of contributors; seed a few so that
  // `totalUnits` equals the sum of units actually held. The purchase flow
  // maintains that invariant (every contribution mints units to a buyer), and
  // `recordReturn` divides by `totalUnits` — so if the seed breaks it, returns
  // silently vanish into the fund instead of reaching holders.
  // insertMany skips the save hook that assigns referralCode, and the unique
  // index would then collide on the second null — create() runs it per doc.
  const community = await User.create(
    [
      ['9845112233', 'Pooja Sharma', 'Jhansi', 2400],
      ['9845223344', 'Imran Qureshi', 'Gorakhpur', 1850],
      ['9845334455', 'Lakshmi Bai', 'Mirzapur', 1600],
      ['9845445566', 'Dinesh Patel', 'Barabanki', 1450],
      ['9845556677', 'Farida Khatoon', 'Jhansi', 1100],
      ['9845667788', 'Vikas Tiwari', 'Gorakhpur', 700],
    ].map(([phone, name, city, units]) => ({
      phone, name, city, language: 'hi', verified: true, poolUnits: rs(units),
    })),
  );

  buyer.poolUnits = rs(3200);
  referrer.poolUnits = rs(1100);
  seller.poolUnits = rs(600);
  await Promise.all([buyer.save(), referrer.save(), seller.save()]);

  const totalUnits = [buyer, referrer, seller, ...community]
    .reduce((sum, u) => sum + u.poolUnits, 0);

  const businesses = [
    { name: 'Jhansi Dairy Collective', nameHi: 'झाँसी डेयरी सहकारी', city: 'Jhansi', category: 'farm', amountFunded: rs(3500), monthlyReturnPercent: 2.1, status: 'active' },
    { name: 'Gorakhpur Weavers Unit', nameHi: 'गोरखपुर बुनकर इकाई', city: 'Gorakhpur', category: 'fashion', amountFunded: rs(2700), monthlyReturnPercent: 1.8, status: 'active' },
    { name: 'Mirzapur Masala Mill', nameHi: 'मिर्ज़ापुर मसाला मिल', city: 'Mirzapur', category: 'grocery', amountFunded: rs(1500), monthlyReturnPercent: 2.4, status: 'repaid' },
  ];

  // Capital in repaid businesses is back in the fund, so only active loans are
  // out. Deriving the balance keeps it from drifting when the list is edited.
  const deployed = businesses
    .filter((b) => b.status === 'active')
    .reduce((sum, b) => sum + b.amountFunded, 0);

  const pool = await Pool.create({
    key: 'main',
    totalContributed: totalUnits, // 1 unit is minted per paise contributed
    totalUnits,
    balance: totalUnits - deployed,
    totalReturns: rs(940),
    businesses,
  });

  console.log('\nSeeded:');
  console.log(`  seller   ${seller.phone}  (${seller.name})  ref=${seller.referralCode}`);
  console.log(`  referrer ${referrer.phone}  (${referrer.name})  ref=${referrer.referralCode}`);
  console.log(`  buyer    ${buyer.phone}  (${buyer.name})  ref=${buyer.referralCode}  wallet=₹${buyer.walletBalance / 100}`);
  console.log(`  ${community.length} more community members holding pool units`);
  console.log(`  ${products.length} products, 3 posts, pool balance ₹${pool.balance / 100}, ${pool.totalUnits} units\n`);

}
