require("dotenv").config();
const express = require("express");
const { AuthorizationCode } = require("simple-oauth2");
const crypto = require("crypto");

const app = express();

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
// Use full HTTPS URL for Railway
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'https://socketio-production-04a7.up.railway.app/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing CLIENT_ID or CLIENT_SECRET in .env file.");
  process.exit(1);
}

const config = {
  client: {
    id: CLIENT_ID,
    secret: CLIENT_SECRET,
  },
  auth: {
    tokenHost: "https://www.linkedin.com",
    tokenPath: "/oauth/v2/accessToken",
    authorizePath: "/oauth/v2/authorization",
  },
  options: {
    authorizationMethod: 'body',
  }
};

const client = new AuthorizationCode(config);

const generateState = () => crypto.randomBytes(16).toString('hex');

app.get("/", (req, res) => {
  const state = generateState();
  
  const authorizationUri = client.authorizeURL({
    redirect_uri: REDIRECT_URI,
    scope: "w_member_social",
    state: state,
    response_type: 'code'
  });

  console.log('Authorization URL:', authorizationUri); // Debug log

  res.send(`
    <h2>LinkedIn OAuth2 Demo</h2>
    <p><a href="${authorizationUri}">Log in with LinkedIn</a></p>
  `);
});

app.get("/callback", async (req, res) => {
  const { code, error, state } = req.query;

  console.log('Callback received:', { code, error, state }); // Debug log

  if (error) {
    console.error("Authorization Error:", error);
    return res.status(400).send(`<h3>Authorization Error</h3><p>${error}</p>`);
  }

  if (!code) {
    return res.status(400).send("<h3>Missing authorization code</h3>");
  }

  try {
    const tokenParams = {
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    };

    console.log('Token request params:', {
      ...tokenParams,
      client_id: CLIENT_ID,
    });

    const accessToken = await client.getToken(tokenParams);
    
    res.send('<h3>Authentication successful!</h3>');
    console.log("Access Token obtained successfully");
  } catch (error) {
    console.error("Token Error Details:", {
      message: error.message,
      data: error.data,
      response: error.response?.data,
      status: error.response?.status
    });

    const errorMessage = error.response?.data?.error_description || 
                        error.data?.error_description || 
                        error.message || 
                        "Authentication failed";
                        
    res.status(500).send(`
      <h3>Error</h3>
      <p>${errorMessage}</p>
      <pre>${JSON.stringify(error.response?.data || {}, null, 2)}</pre>
    `);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
});
