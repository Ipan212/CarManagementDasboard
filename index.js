const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser'); // Pastikan Anda telah menginstal middleware body-parser

const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads'); // Ganti dengan direktori yang sesuai dengan proyek Anda
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Konfigurasi view engine untuk menggunakan EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, "/public")))


// Middleware untuk mengurai body permintaan JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Model Mobil
const { Mobil } = require('./models');

// Rute untuk menampilkan daftar mobil

app.get('/mobil', async (req, res) => {
  try {
    const mobilList = await Mobil.findAll();
    const notificationMessage = req.query.notificationMessage; // Ambil pesan notifikasi dari query string jika ada
    res.render('list', { mobilList, notificationMessage });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan dalam mengambil data mobil.');
  }
});



// Rute untuk menampilkan halaman tambah mobil
app.get('/mobil/tambah', (req, res) => {
  res.render('tambah');
});

// Rute untuk menangani penambahan data mobil
app.post('/mobil/tambah', upload.single('images'), async (req, res) => {
  try {
    const { name, price, category } = req.body;
    const imagePath = req.file.path; // Lokasi gambar yang diunggah

    // Simpan data mobil dan lokasi gambar ke dalam database
    await Mobil.create({ name, price, category, images: imagePath });

    // Tambahkan notifikasi di sini
    const notificationMessage = 'Data mobil berhasil ditambahkan!';
    
    // Setelah menambahkan data, arahkan ke halaman daftar mobil
    const mobilList = await Mobil.findAll();
    res.render('list', { mobilList, notificationMessage });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan dalam menambahkan data mobil.');
  }
});

// Rute untuk menampilkan halaman edit mobil
app.get('/mobil/edit/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const mobil = await Mobil.findByPk(id);
    if (mobil) {
      res.render('edit', { mobil });
    } else {
      res.status(404).send('Data mobil tidak ditemukan.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan dalam mengambil data mobil.');
  }
});

// Rute untuk menangani modifikasi data mobil
app.post('/mobil/edit/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, price, category, images } = req.body;
    const mobil = await Mobil.findByPk(id);
    if (mobil) {
      mobil.name = name;
      mobil.price = price;
      mobil.category = category;
      mobil.images = images;
      await mobil.save();
      res.redirect('/mobil');
    } else {
      res.status(404).send('Data mobil tidak ditemukan.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan dalam memodifikasi data mobil.');
  }
});

// Rute untuk menghapus data mobil
app.get('/mobil/hapus/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const mobil = await Mobil.findByPk(id);
    if (mobil) {
      await mobil.destroy();
      const notificationMessage = 'Data mobil berhasil dihapus!';
      res.redirect('/mobil?notificationMessage=' + encodeURIComponent(notificationMessage)); // Redirect ke /mobil dengan pesan notifikasi
    } else {
      res.status(404).send('Data mobil tidak ditemukan.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan dalam menghapus data mobil.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port http://localhost:${PORT}`);
});
