# FlowGenius: No-Code Automation Platform

FlowGenius is a modern, AI-native workflow automation platform that enables users to build complex automation workflows without coding. Think Zapier, but built with modern tech and AI at its core.

## 🚀 Features

### 🔄 Visual Workflow Builder
- Drag-and-drop interface for creating workflows
- Real-time workflow validation
- Node configuration panel
- Live execution preview
- Auto-layout and grid snapping

### 🧩 Node Types
- **Triggers**: Start workflows (e.g., Supabase database changes)
- **Conditions**: Branch workflows based on data
- **AI Blocks**: Process data with OpenAI
- **Actions**: Execute tasks (e.g., send emails, update database)

### 🔌 Integrations
- Supabase for database operations
- OpenAI for AI/ML capabilities
- SendGrid for email delivery
- Resend for modern email services

### 📊 Analytics & Monitoring
- Execution statistics
- Time saved metrics
- Integration usage analytics
- Performance monitoring
- Success/failure tracking

### 📝 Execution Logs
- Detailed execution history
- Node-level logging
- Error tracking
- Performance metrics

## 🛠️ Workflow Engine

### Architecture

The workflow engine is responsible for executing workflows in a reliable and predictable manner. Here's how it works:

#### 1. Workflow Structure
- Each workflow is a directed graph of nodes
- Nodes represent actions, triggers, conditions, or AI operations
- Edges define the flow between nodes
- Each node has:
  - Type (trigger, condition, action, aiblock)
  - Configuration (user-defined settings)
  - Integration reference (if using external services)

#### 2. Execution Flow
1. **Initialization**
   - Create execution log entry
   - Initialize context object
   - Load required integrations

2. **Node Execution**
   - Start from trigger node
   - Execute each node sequentially
   - Pass data through context object
   - Handle branching logic for conditions
   - Log execution details

3. **Variable System**
   - Uses {{variableName}} syntax
   - Variables are stored in context
   - Accessible between nodes
   - Supports nested properties

4. **Integration Handling**
   - Load integration credentials
   - Make authenticated API calls
   - Handle rate limiting
   - Error handling and retries

#### 3. Current Implementation
```typescript
class WorkflowEngine {
  async execute(initialContext = {}) {
    // 1. Create execution log
    // 2. Find trigger node
    // 3. Execute nodes sequentially
    // 4. Handle errors
    // 5. Update execution log
    // 6. Return results
  }

  private async executeNode(nodeId: string) {
    // 1. Load node configuration
    // 2. Get required integration
    // 3. Execute based on node type
    // 4. Update context
    // 5. Find and execute next node
  }
}
```

#### 4. Execution Logging
- Every execution creates a log entry
- Tracks:
  - Start/end time
  - Duration
  - Success/failure
  - Input/output context
  - Node-level logs
  - Errors

### Current Limitations

1. **Browser-based Execution**
   - Runs in the frontend
   - Limited by browser constraints
   - API keys exposed to client
   - No background execution

2. **No Queue System**
   - Immediate execution only
   - No retry mechanism
   - No rate limiting
   - No scheduled workflows

3. **Limited Error Handling**
   - Basic error capture
   - No automatic retries
   - No fallback mechanisms
   - No dead letter queue

### Planned Improvements

1. **Edge Functions Migration**
   - Move execution to Supabase Edge Functions
   - Secure credential handling
   - Better error handling
   - Longer execution time

2. **Queue System**
   - Implement job queue
   - Retry mechanisms
   - Rate limiting
   - Dead letter queue

3. **Background Processing**
   - Scheduled workflows
   - Webhook handling
   - Long-running tasks
   - Event-based triggers

4. **Enhanced Monitoring**
   - Real-time execution tracking
   - Performance metrics
   - Resource usage
   - Cost tracking

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Lucide Icons
- **State**: Zustand
- **Workflow**: React Flow
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Netlify

## 📦 Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/flowgenius.git
cd flowgenius
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Start the development server
```bash
npm run dev
```

## 🔒 Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details