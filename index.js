const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser'); // Pastikan Anda telah menginstal middleware body-parser

const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Ganti dengan direktori yang sesuai dengan proyek Anda
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Konfigurasi view engine untuk menggunakan EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
//menjadikan sebuah direkctory bisa di akses dimana saja
app.use(express.static(path.join(__dirname, "/public")))
app.use(express.static(path.join(__dirname, "/uploads")))

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
    const { name, price, category, uploadType, imageUrl } = req.body;
    let imagePath;

    if (uploadType === 'file') {
      imagePath = req.file.filename;
    } else if (uploadType === 'url') {
      // Validasi URL gambar, pastikan itu URL gambar yang valid
      const isValidImageUrl = /* Lakukan validasi di sini */ true;

      if (isValidImageUrl) {
        imagePath = imageUrl;
      } else {
        // Tangani kesalahan jika URL gambar tidak valid
        res.status(400).send('URL gambar tidak valid.');
        return;
      }
    }

    await Mobil.create({ name, price, category, images: imagePath });
    const notificationMessage = 'Data mobil berhasil ditambahkan!';
    
    res.redirect('/mobil?notificationMessage=' + encodeURIComponent(notificationMessage)); // Redirect ke /mobil dengan pesan notifikasi

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
