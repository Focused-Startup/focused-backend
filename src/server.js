require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const app = express();
const { Agent } = require('./agent');
const { ensureFocusedRequest } = require('./middleware/ensureFocusedRequest');
const port = process.env.PORT || 3000;

app.use(express.json());
app.get('/api-docs.json', (_req, res) => {
  res.status(200).json(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'focused-backend is running' });
});

app.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  try {
    const agentInstance = new Agent();
    const response = await agentInstance.generateResponse(prompt);
    res.status(200).json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});