require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const fileuploadRoutes = require("./routes/fileuploadRoutes");

const usersRoutes = require('./routes/usersRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const permissionsRoutes = require('./routes/permissionsRoutes');
const pagesRoutes = require('./routes/pagesRoutes');
const pagescategoryRoutes = require('./routes/pagescategoryRoutes');
const siteconfigRoutes = require('./routes/siteconfigRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const productRoutes = require('./routes/productRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const { initTables } = require('./config/initTables');
const participantsRoutes = require('./routes/participantsRoutes');
const scanRoutes = require('./routes/scanRoutes');
const staffRoutes = require('./routes/staffRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const allocationsRoutes = require('./routes/allocationsRoutes');
const eventReportsRoutes = require('./routes/eventReportsRoutes');
const scanEventsRoutes = require('./routes/scanEventsRoutes');
const completionLogsRoutes = require('./routes/completionLogsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;  

// CORS options
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));

app.use("/api/file", fileuploadRoutes);

app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/pagescategory', pagescategoryRoutes);
app.use('/api/siteconfig', siteconfigRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/product', productRoutes);
app.use('/api/banner', bannerRoutes);
app.use('/api/participants', participantsRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api', allocationsRoutes);
app.use('/api', eventReportsRoutes);
app.use('/api/scan-events', scanEventsRoutes);
app.use('/api', completionLogsRoutes);

initTables()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database tables:', err);
    process.exit(1);
  });
