const express = require('express');
const cors = require('cors');
const pool = require('./database'); // Your database connection setup
const multer = require('multer');
const path = require('path')
const app = express();
const router = express.Router();
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ dest: "uploads/" }); // For memory storage or disk storage

// Middleware
app.use(express.json());

// Allow all origins or specify frontend's origin for CORS
app.use(cors({
  origin: 'http://localhost:3000', // React frontend's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  credentials: true // Enable this if using cookies or authentication
}));

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  // host: 'smtp-relay.brevo.com', // Host for Office 365
  // port: 587, // Port for STARTTLS
  // secure: false, // Use TLS

  // auth: {
  //   user: '82afcc001@smtp-brevo.com', // Replace with your email
  //   pass: 'xsmtpsib-e4ec586b0645a90982d2a5d962622b515e4f907284c247614a2e85ce454650ae-UO7kwAEtRxPpvN8f', // Replace with your email password or app-specific password
  // },

  host: 'smtp.office365.com', // Host for Office 365
  port: 587, // Port for STARTTLS
  secure: false, // Use TLS

  auth: {
    user: 'sbot@stretchline.com', // Replace with your email
    pass: 'SdfXCV@#123', // Replace with your email password or app-specific password
  },
});


// Run every day at midnight
// Cron Job to Update Status
cron.schedule('* * * * *', async () => { // Runs every minute
  console.log('Cron job executed at:', new Date());
  try {
    // Fetch rows to be updated
    const [rows] = await pool.query(
      `SELECT * FROM kaizens 
       WHERE status = 'TrialOngoing' AND createdAt <= DATE_SUB(NOW(), INTERVAL 1 MINUTE)`
    );

    if (rows.length > 0) {
      console.log('Rows to be updated:', rows);

      // Update the status
      const [result] = await pool.query(
        `UPDATE kaizens 
         SET status = 'Pending Manager Approval'
         WHERE status = 'TrialOngoing' AND createdAt <= DATE_SUB(NOW(), INTERVAL 1 MINUTE)`
      );
      console.log(`Status updated for ${result.affectedRows} Kaizens.`);

      // Loop through each Kaizen and send emails
      for (const kaizen of rows) {
        try {
          // Fetch team lead's email using teamLeadEpf from kaizen_users table
          const [teamLead] = await pool.query(
            `SELECT tl.email 
             FROM team_leads tl
             JOIN kaizen_users ku ON ku.teamLeadEpf = tl.epf
             WHERE ku.epf = ?`,
            [kaizen.epf]
          );

          if (teamLead.length === 0) {
            console.warn(`No team lead found for Kaizen ID: ${kaizen.id}`);
            continue;
          }

          const nextEmailRecipient = teamLead[0].email; // Fetch the email address dynamically

          // Define the email options
          const mailOptions = {
            from: 'sbot@stretchline.com', // Replace with your sender email
            to: nextEmailRecipient, // Use the dynamically fetched manager's email
            subject: 'New Kaizen Requires Your Approval',
            text: `Hello Manager,

A new Kaizen titled "${kaizen.title}" has been moved to "Pending Manager Approval" status. 
Please review and approve it.

Details:
- Title: ${kaizen.title}
- Description: ${kaizen.beforeDescription || 'N/A'}
- Submitted By: ${kaizen.submittedBy || 'N/A'}

Thank you,
Your Kaizen Management System`,
          };

          // Send the email
          await transporter.sendMail(mailOptions);
          console.log(`Email sent for Kaizen ID: ${kaizen.id} to ${nextEmailRecipient}`);
        } catch (emailError) {
          console.error(`Error sending email for Kaizen ID: ${kaizen.id}`, emailError.message);
        }
      }
    } else {
      console.log('No Kaizens require status update.');
    }
  } catch (error) {
    console.error('Error while updating statuses or sending emails:', error.message);
  }
});

// Login API

// Login API
app.post('/api/login', async (req, res) => {
  const { epf, password } = req.body;

  if (!epf || !password) {
    return res.status(400).json({ success: false, message: 'EPF and password are required' });
  }

  try {
    // Check in kaizen_users table
    const [kaizenUser] = await pool.query(
      'SELECT * FROM kaizen_users WHERE epf = ? AND password = ?',
      [epf, password]
    );

    if (kaizenUser.length > 0) {
      // Found in kaizen_users table
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          epf: kaizenUser[0].epf,
          name: kaizenUser[0].name,
          shift: kaizenUser[0].shift,
          section: kaizenUser[0].section,
          teamLeadEpf: kaizenUser[0].teamLeadEpf,
          role: null, // No role for normal users
        },
      });
    }

    // Check in kaizen_admin_users table
    const [adminUser] = await pool.query(
      'SELECT * FROM kaizen_admin_users WHERE epf = ? AND password = ?',
      [epf, password]
    );

    if (adminUser.length > 0) {
      // Found in kaizen_admin_users table
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          epf: adminUser[0].epf,
          name: adminUser[0].username,
          role: adminUser[0].role, // Include the role
        },
      });
    }

    // User not found in either table
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ success: false, message: 'Error during login' });
  }
});




app.post("/api/kaizens", upload.fields([
  { name: "beforeImagePreviews", maxCount: 5 },
  { name: "afterImagePreviews", maxCount: 5 },
  { name: "attachments", maxCount: 2 },
]), async (req, res) => {
  console.log("POST /api/kaizens hit");
  console.log("Request Body:", req.body); // Text fields
  console.log("Request Files:", req.files); // Uploaded files

  const { epf, title, category, beforeDescription, afterDescription, saving, savingCalculation } = req.body;

  const beforeImagePreviews = req.files.beforeImagePreviews || [];
  const afterImagePreviews = req.files.afterImagePreviews || [];
  const attachments = req.files.attachments || [];

  if (!title || !category || !beforeDescription || !afterDescription || !saving || !savingCalculation || !epf) {
    return res.status(400).json({ success: false, message: "All fields are required, including EPF." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO kaizens (title, category, beforeDescription, afterDescription, saving, savingCalculation, epf, beforeImagePreviews, afterImagePreviews, attachments) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        beforeDescription,
        afterDescription,
        saving,
        savingCalculation,
        epf,
        JSON.stringify(beforeImagePreviews.map((file) => file.originalname)),
        JSON.stringify(afterImagePreviews.map((file) => file.originalname)),
        JSON.stringify(attachments.map((file) => file.originalname)),
      ]
    );

    res.status(201).json({ success: true, message: "Kaizen added successfully", kaizenId: result.insertId });
  } catch (error) {
    console.error("Error adding Kaizen:", error.message);
    res.status(500).json({ success: false, message: "Error adding Kaizen." });
  }
});


// Fetch all users
app.get('/api/kaizen_users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM kaizen_users');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

app.post('/api/kaizen_users', async (req, res) => {
  const { epf, name, shift, section, password, teamLeadEpf, department, plant } = req.body;

  if (!epf || !name || !shift || !section || !password || !teamLeadEpf || !department || !plant) {
    console.log('Validation failed:', { epf, name, shift, section, password, teamLeadEpf, department, plant });
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  const payload = {
    epf,
    name,
    shift,
    section,
    password,
    teamLeadEpf,
    department,
    plant
  };
  try {
    const [result] = await pool.query(
      `INSERT INTO kaizen_users (epf, name, shift, section, password, teamLeadEpf,department, plant) VALUES (?, ?, ?, ?, ?,?, ?, ?)`,
      [epf, name, shift, section, password, teamLeadEpf, department, plant]
    );
    res.status(201).json({
      success: true,
      message: 'User added successfully',
      result: { insertId: result.insertId },
    });
  } catch (err) {
    console.error('Database Error:', err.message);
    res.status(500).json({ success: false, message: 'Database error occurred' });
  }
});


// Endpoint to add a Kaizen
app.post(
  "/api/kaizens",
  upload.fields([
    { name: "beforeImagePreviews", maxCount: 5 },
    { name: "afterImagePreviews", maxCount: 5 },
    { name: "attachments", maxCount: 2 },
  ]),
  async (req, res) => {
    try {
      console.log("POST /api/kaizens hit"); // Log route hit
      console.log("Request Body:", req.body); // Log request body
      console.log("Request Files:", req.files); // Log uploaded files

      const { epf, title, category, beforeDescription, afterDescription, saving, savingCalculation } = req.body;

      const beforeImagePreviews = req.files.beforeImagePreviews || [];
      const afterImagePreviews = req.files.afterImagePreviews || [];
      const attachments = req.files.attachments || [];

      if (!title || !category || !beforeDescription || !afterDescription || !saving || !savingCalculation || !epf) {
        return res.status(400).json({ success: false, message: "All fields are required, including EPF." });
      }

      const [result] = await pool.query(
        `INSERT INTO kaizens (title, category, beforeDescription, afterDescription, saving, savingCalculation, epf, beforeImagePreviews, afterImagePreviews, attachments) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          category,
          beforeDescription,
          afterDescription,
          saving,
          savingCalculation,
          epf,
          JSON.stringify(beforeImagePreviews.map((file) => file.filename)),
          JSON.stringify(afterImagePreviews.map((file) => file.filename)),
          JSON.stringify(attachments.map((file) => file.filename)),
        ]
      );
      console.log("Kaizen added successfully with ID:", result.insertId);
      res.status(201).json({ success: true, message: "Kaizen added successfully", kaizenId: result.insertId });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ success: false, message: "Server error occurred." });
    }
  }
);


// Handle undefined routes
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, "your-secret-key"); // Replace with your secret
      req.user = decoded; // Attach decoded token (e.g., `epf`) to `req.user`
    } catch (err) {
      console.error("Invalid token");
    }
  }
  next();
});

app.get("/api/kaizens/:epf", async (req, res) => {
  const { epf } = req.params;

  if (!epf) {
    return res.status(400).json({ success: false, message: "EPF is required." });
  }

  try {
    const [kaizens] = await pool.query("SELECT * FROM kaizens WHERE epf = ?", [epf]);

    if (kaizens.length === 0) {
      return res.status(404).json({ success: false, message: "No Kaizens found for this EPF." });
    }

    res.status(200).json({ success: true, data: kaizens });
  } catch (error) {
    console.error("Error fetching Kaizens:", error.message);
    res.status(500).json({ success: false, message: "Server error occurred while fetching Kaizens." });
  }
});

app.get("/api/kaizen/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID is required." });
  }

  try {
    const [kaizen] = await pool.query("SELECT * FROM kaizens WHERE id = ?", [id]);

    if (kaizen.length === 0) {
      return res.status(404).json({ success: false, message: "Kaizen not found." });
    }

    res.status(200).json({ success: true, data: kaizen[0] });
  } catch (error) {
    console.error("Error fetching Kaizen:", error.message);
    res.status(500).json({ success: false, message: "Server error occurred while fetching the Kaizen." });
  }
});

// API to check if a user is a team lead
app.get("/api/team_leads/:epf", async (req, res) => {
  const { epf } = req.params;

  try {
    const [result] = await pool.query("SELECT * FROM team_leads WHERE epf = ?", [epf]);

    if (result.length > 0) {
      return res.status(200).json({ success: true, isTeamLead: true, data: result[0] });
    } else {
      return res.status(200).json({ success: true, isTeamLead: false });
    }
  } catch (error) {
    console.error("Error checking team lead:", error.message);
    res.status(500).json({ success: false, message: "Error checking team lead." });
  }
});

// Route to fetch Kaizens supervised by the logged-in team lead
app.get("/api/team_kaizens/:teamLeadEpf", async (req, res) => {
  const { teamLeadEpf } = req.params;

  try {
    const query = `
      SELECT 
        k.id, 
        k.title, 
        k.category, 
        k.beforeDescription, 
        k.afterDescription, 
        k.saving, 
        k.status, 
        k.createdAt,
        ku.name, 
        ku.section, 
        ku.shift
      FROM 
        kaizens k
      JOIN 
        kaizen_users ku 
      ON 
        k.epf = ku.epf
      WHERE 
        ku.teamLeadEpf = ?;
    `;

    const [kaizens] = await pool.query(query, [teamLeadEpf]);

    return res.status(200).json({ success: true, data: kaizens });
  } catch (error) {
    console.error("Error fetching supervised Kaizens:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch supervised Kaizens." });
  }
});


// Approve or Reject Kaizen by Stage
// API route to handle approval actions
app.post("/api/kaizen/:id/action", async (req, res) => {
  const { id } = req.params;
  const { stage, action, comment, saving, approvalNote } = req.body;


  // Fetch the updated Kaizen data
  const [updatedKaizen] = await pool.query(`SELECT * FROM kaizens WHERE id = ?`, [id]);
  
  if (!id || !stage || !action) {
    return res.status(400).json({
      success: false,
      message: "Kaizen ID, stage, and action are required.",
    });
  }

  try {
    let updateField = "";
    let statusText = "";
    let nextEmailRecipient = null; // Placeholder for the next stage's email recipient
    let nextStageName = ""; // Placeholder for the next stage's name

    // Determine which stage is being updated and configure accordingly
    if (stage === "manager") {
      updateField = `
        managerComments = ?, 
        managerSavings = ?, 
        managerApprovalNotes = ?
      `;
      statusText = action === "approve" ? "Manager Approved" : "Manager Rejected";

      if (action === "approve") {
        nextEmailRecipient = "sandinijay@gmail.com"; // Process Excellence Manager's email - only one ---  email thilinidee@stretchline.com
        nextStageName = "Process Excellence Manager";
      }
    } else if (stage === "processExcellence") {
      // Update fields for process excellence stage
      updateField = `
        processExcellenceComments = ?, 
        processExcellenceSavings = ?, 
        processExcellenceApprovalNotes = ?
      `;
      statusText = action === "approve"
        ? "Process Excellence Manager Approved"
        : "Process Excellence Manager Rejected";

      if (action === "approve") {
        // After Process Excellence approval, fetch Finance Rep Email dynamically
        const [financeRep] = await pool.query(
          `SELECT kfr.finance_rep_email 
           FROM kaizen_finance_reps kfr
           JOIN kaizen_users ku ON ku.department = kfr.department
           WHERE ku.epf = (
             SELECT epf FROM kaizens WHERE id = ?
           )`,
          [id]
        );

        if (financeRep.length > 0) {
          nextEmailRecipient = financeRep[0].finance_rep_email; // Finance Rep's email
          nextStageName = "Finance Rep";
        } else {
          console.warn("No Finance Rep found for the department of the Kaizen owner.");
          nextEmailRecipient = null; // No email to send if no Finance Rep is found
        }
      }
    } else if (stage === "finance") {
      // Update fields for finance stage
      updateField = `
        financeComments = ?, 
        financeSavings = ?, 
        financeApprovalNotes = ?
      `;
      statusText = action === "approve" ? "Finance Rep Approved" : "Finance Rep Rejected";

      if (action === "approve") {
        // Send a notification to the Finance Manager after Finance Rep approval
        const financeManagerEmail = "finance.manager@company.com"; // Replace with dynamic logic if needed
        try {
          await transporter.sendMail({
            from: "sbot@stretchline.com",
            to: financeManagerEmail,
            subject: "Kaizen Fully Approved",
            text: `Hello Finance Manager,
    
    A Kaizen titled "${updatedKaizen[0].title}" has been fully approved by the Finance Rep.
    
    Details:
    - Title: ${updatedKaizen[0].title}
    - Description: ${updatedKaizen[0].beforeDescription || "N/A"}
    - Approved By: Finance Rep
    
    Thank you,
    Kaizen Management System`,
          });
          console.log(`Notification sent to Finance Manager: ${financeManagerEmail}`);
        } catch (emailError) {
          console.error("Error sending email to Finance Manager:", emailError.message);
        }
      }
    }

    // Update the database
    await pool.query(
      `UPDATE kaizens 
       SET ${updateField}, status = ? 
       WHERE id = ?`,
      [comment || null, saving ? parseFloat(saving) : null, approvalNote || null, statusText, id]
    );

    

    // Send an email notification if applicable
    if (nextEmailRecipient) {
      try {
        await transporter.sendMail({
          from: "sbot@stretchline.com", // Your sender email
          to: nextEmailRecipient,
          subject: "New Kaizen Approval Required",
          text: `Hello ${nextStageName},

A new Kaizen titled "${updatedKaizen[0].title}" is awaiting your approval.

Details:
- Title: ${updatedKaizen[0].title}
- Description: ${updatedKaizen[0].beforeDescription || "N/A"}
- Approved By: ${stage.charAt(0).toUpperCase() + stage.slice(1)} (${statusText})

Please check the system for further details.

Thank you,
Kaizen Management System`,
        });
        console.log(`Notification email sent to ${nextStageName}: ${nextEmailRecipient}`);
      } catch (emailError) {
        console.error("Error sending email:", emailError.message);
      }
    }

    // Respond to the frontend
    res.status(200).json({
      success: true,
      message: `Kaizen ${action} by ${stage}.`,
      data: updatedKaizen[0], // Send the updated data
    });
  } catch (error) {
    console.error("Error updating Kaizen:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error occurred while updating Kaizen.",
    });
  }
});

app.get('/api/kaizensall', async (req, res) => {
  const { role } = req.query;

  // Role validation handled here
  if (!role || (role !== 'process_exc_manager' && role !== 'finance_manager' && role !== 'finance_rep')) {
    return res.status(403).json({ success: false, message: 'Unauthorized access' });
  }

  try {
    const [kaizens] = await pool.query('SELECT * FROM kaizens');

    if (kaizens.length === 0) {
      return res.status(404).json({ success: false, message: 'No Kaizens found.' });
    }
    return res.status(200).json({ success: true, data: kaizens });
  } catch (error) {
    console.error('Error fetching all Kaizens:', error.message);
    return res.status(500).json({ success: false, message: 'Server error occurred.' });
  }
});


// temp
// app.get('/api/kaizensall', async (req, res) => {
//   try {
//     console.log("Attempting to fetch all Kaizens...");

//     const [kaizens] = await pool.query('SELECT * FROM kaizens');

//     console.log("Query result:", kaizens); // Debugging the query result

//     if (kaizens.length === 0) {
//       console.log("No Kaizens found in the database.");
//       return res.status(404).json({ success: false, message: 'No Kaizens found.' });
//     }

//     console.log("Kaizens found:", kaizens);
//     return res.status(200).json({ success: true, data: kaizens });
//   } catch (error) {
//     console.error('Error fetching all Kaizens:', error.message);
//     return res.status(500).json({ success: false, message: 'Server error occurred.' });
//   }
// });

//check admins in admin_table
app.get("/api/admin_leads/:epf", async (req, res) => {
  const { epf } = req.params;

  try {
    const [result] = await pool.query("SELECT * FROM kaizen_admin_users WHERE epf = ?", [epf]);

    if (result.length > 0) {
      return res.status(200).json({ success: true, isAdminLead: true, data: result[0] });
    } else {
      return res.status(200).json({ success: true, isAdminLead: false });
    }
  } catch (error) {
    console.error("Error checking admin lead:", error.message);
    res.status(500).json({ success: false, message: "Error checking admin lead." });
  }
});



// test connectivity
app.get('/api/test', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1');
    return res.status(200).json({ success: true, message: 'Database connection is working.' });
  } catch (error) {
    console.error('Database connection error:', error.message);
    return res.status(500).json({ success: false, message: 'Database connection failed.' });
  }
});


// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


module.exports = router;