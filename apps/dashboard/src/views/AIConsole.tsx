import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  PageLayout,
} from '@/components';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/' },
  { id: 'terminal', label: 'Product Terminal', href: '/terminal' },
  { id: 'marketplace', label: 'Marketplace', href: '/marketplace' },
  { id: 'forum', label: 'Community Forum', href: '/forum' },
  { id: 'billing', label: 'Billing', href: '/billing' },
  { id: 'analytics', label: 'Analytics', href: '/analytics' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, any>;
    result: any;
  }>;
}

interface ToolCall {
  name: string;
  description: string;
  icon: string;
}

export const AIConsole: React.FC = () => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to Masco Intel AI Console. I can help you with product searches, price comparisons, market analysis, and more. Try asking me something like "Find the best faucets under $200" or "Compare Kohler vs Delta pricing".',
      timestamp: '2026-05-13 10:00 AM',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const availableTools: ToolCall[] = [
    {
      name: 'pricing-scan',
      description: 'Scan and compare prices across retailers',
      icon: '💰',
    },
    {
      name: 'oem-tree',
      description: 'Analyze OEM relationships and product lineage',
      icon: '🌳',
    },
    {
      name: 'compat-map',
      description: 'Find compatible products and alternatives',
      icon: '🔗',
    },
    {
      name: 'market-intel',
      description: 'Get market trends and brand analysis',
      icon: '📊',
    },
    {
      name: 'quality-check',
      description: 'Analyze product quality and reliability',
      icon: '✓',
    },
    {
      name: 'contractor-roi',
      description: 'Calculate ROI for contractor decisions',
      icon: '💡',
    },
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleString(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm analyzing your request: "${inputValue}". In a real implementation, this would connect to the backend AI service with streaming responses, tool calls, and citations. For now, I'm showing you the UI structure.`,
        timestamp: new Date().toLocaleString(),
        toolCalls: [
          {
            name: 'pricing-scan',
            args: { product: inputValue, retailers: ['Home Depot', 'Lowes', 'Ferguson'] },
            result: {
              products: [
                { sku: '9159-AR-DST', name: 'Trinsic Single-Handle', price: 185.99, retailer: 'Home Depot' },
              ],
            },
          },
        ],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleToolClick = (toolName: string) => {
    const toolDescriptions: Record<string, string> = {
      'pricing-scan': 'Scan prices across all major retailers for this product.',
      'oem-tree': 'Show the OEM relationship tree and product lineage.',
      'compat-map': 'Find compatible products and aftermarket alternatives.',
      'market-intel': 'Get brand market share, trends, and positioning.',
      'quality-check': 'Analyze failure rates, warranty, and longevity.',
      'contractor-roi': 'Calculate total cost of ownership and ROI.',
    };

    const message = `Use the ${toolName.replace('-', ' ')} tool: ${toolDescriptions[toolName]}`;
    setInputValue(message);
  };

  return (
    <PageLayout
      active={activeNav}
      navItems={NAV_ITEMS}
      onNavigate={setActiveNav}
      crumbs={['AI Console']}
      liveIndicator={true}
      logo={
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded"
            style={{ background: 'var(--grad-iq)' }}
          />
          <span className="font-bold text-sm">Masco Intel</span>
        </div>
      }
    >
      <div className="p-6 space-y-6 h-full flex flex-col">
        {/* Available Tools */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold">Available Tools</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-6 gap-3">
              {availableTools.map((tool) => (
                <button
                  key={tool.name}
                  onClick={() => handleToolClick(tool.name)}
                  className="p-4 rounded-lg border border-line-1 hover:bg-bg-2 transition text-center"
                  style={{ backgroundColor: 'var(--bg-2)' }}
                >
                  <div className="text-2xl mb-2">{tool.icon}</div>
                  <div className="text-xs font-medium">{tool.name.replace('-', ' ')}</div>
                  <div className="text-xs text-ink-3 mt-1">{tool.description}</div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Chat History */}
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded"
                style={{ background: 'var(--violet)' }}
              />
              <h3 className="text-base font-semibold">Conversation</h3>
            </div>
          </CardHeader>
          <CardBody className="overflow-y-auto flex-1 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-2xl rounded-lg p-4"
                  style={{
                    backgroundColor:
                      msg.role === 'user' ? 'var(--cyan)' : 'var(--bg-2)',
                    color: msg.role === 'user' ? 'var(--bg-0)' : 'var(--ink-1)',
                  }}
                >
                  <p className="text-sm mb-2">{msg.content}</p>

                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-line-1 pt-3">
                      {msg.toolCalls.map((call, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="font-medium text-violet mb-1">
                            🔧 {call.name}
                          </div>
                          <div className="text-ink-3 mb-1">Args:</div>
                          <pre
                            className="text-xs overflow-x-auto p-2 rounded"
                            style={{ backgroundColor: 'var(--bg-3)' }}
                          >
                            {JSON.stringify(call.args, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-ink-3 mt-2">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: 'var(--bg-2)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: 'var(--violet)' }}
                    />
                    <span className="text-sm text-ink-2">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardBody>
        </Card>

        {/* Input Area */}
        <Card>
          <CardBody className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about products, pricing, market trends..."
                className="flex-1 px-4 py-3 rounded-lg border border-line-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-2)',
                  color: 'var(--ink-0)',
                }}
                disabled={isLoading}
              />
              <Button
                variant="accent"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                Send
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-ink-3">
              <span>💡 Tip: Use ⌘K (or Ctrl+K) to open Command Palette</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AIConsole;
