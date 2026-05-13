import React, { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  PageLayout,
} from '@/components';
import { useForm } from '@/hooks';
import { useAPIMutation } from '@/hooks';
import { useToast } from '@/hooks';
import { CommonValidation } from '@/utils/form';
import { communityAPI } from '@/services/api';

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

interface Category {
  id: string;
  name: string;
  description: string;
  threadCount: number;
}

interface Thread {
  id: string;
  category: string;
  title: string;
  author: string;
  replies: number;
  views: number;
  lastActivity: string;
  pinned: boolean;
}

interface Reply {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  helpful: number;
}

export const Community: React.FC = () => {
  const [activeNav, setActiveNav] = useState('forum');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { addToast } = useToast();

  const { execute: postReply, loading: isSubmittingReply } = useAPIMutation(
    (data: { content: string }) =>
      communityAPI.postReply(selectedThread || '', data.content)
  );

  const replyForm = useForm({
    initialValues: { content: '' },
    validationSchema: {
      content: [
        CommonValidation.required('Please enter a reply'),
        CommonValidation.minLength(10, 'Reply must be at least 10 characters'),
        CommonValidation.maxLength(5000, 'Reply cannot exceed 5000 characters'),
      ],
    },
    onSubmit: async (values) => {
      try {
        await postReply(values);
        replyForm.resetForm();
        addToast({
          type: 'success',
          message: 'Reply posted successfully',
          duration: 3000,
        });
      } catch (error) {
        addToast({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to post reply',
          duration: 4000,
        });
      }
    },
  });

  const [categories] = useState<Category[]>([
    {
      id: 'general',
      name: 'General Discussion',
      description: 'Off-topic and general plumbing discussion',
      threadCount: 342,
    },
    {
      id: 'products',
      name: 'Product Recommendations',
      description: 'Ask for and share product recommendations',
      threadCount: 598,
    },
    {
      id: 'installation',
      name: 'Installation & Repair',
      description: 'Technical questions and installation tips',
      threadCount: 756,
    },
    {
      id: 'marketplace',
      name: 'Marketplace Discussion',
      description: 'Contractor services and marketplace feedback',
      threadCount: 423,
    },
    {
      id: 'announcements',
      name: 'Announcements',
      description: 'Platform updates and feature announcements',
      threadCount: 87,
    },
  ]);

  const [threads] = useState<Thread[]>([
    {
      id: '1',
      category: 'products',
      title: 'Best delta faucets for high-traffic commercial bathrooms?',
      author: 'JohnD',
      replies: 23,
      views: 412,
      lastActivity: '2 hours ago',
      pinned: true,
    },
    {
      id: '2',
      category: 'installation',
      title: 'Anyone experienced issues with Trinsic cartridge compatibility?',
      author: 'PlumberMike',
      replies: 15,
      views: 287,
      lastActivity: '4 hours ago',
      pinned: false,
    },
    {
      id: '3',
      category: 'products',
      title: 'Kohler vs Moen vs Delta - comprehensive comparison',
      author: 'TechSarah',
      replies: 45,
      views: 1203,
      lastActivity: '1 day ago',
      pinned: true,
    },
    {
      id: '4',
      category: 'installation',
      title: 'Quick tip: Installing under-counter faucets in tight spaces',
      author: 'ProContractor',
      replies: 8,
      views: 156,
      lastActivity: '5 days ago',
      pinned: false,
    },
    {
      id: '5',
      category: 'marketplace',
      title: 'Looking for bulk contractor quotes on commercial fixtures',
      author: 'BuilderBob',
      replies: 12,
      views: 234,
      lastActivity: '3 hours ago',
      pinned: false,
    },
  ]);

  const [replies] = useState<Reply[]>([
    {
      id: '1',
      author: 'PlumberPro',
      content: 'I\'ve had great success with the delta trinsic line for commercial. The RP cartridge has excellent durability.',
      timestamp: '2 hours ago',
      helpful: 12,
    },
    {
      id: '2',
      author: 'FaucetExpert',
      content: 'The new ceramic disc design in the contractor line offers much better performance than older models.',
      timestamp: '1 hour ago',
      helpful: 8,
    },
    {
      id: '3',
      author: 'JohnD',
      content: 'Thanks for the insights! Very helpful. Already ordered 5 units.',
      timestamp: '30 min ago',
      helpful: 3,
    },
  ]);

  const filteredThreads = selectedCategory === 'all'
    ? threads
    : threads.filter(t => t.category === selectedCategory);

  const selectedThreadData = threads.find(t => t.id === selectedThread);

  return (
    <PageLayout
      active={activeNav}
      navItems={NAV_ITEMS}
      onNavigate={setActiveNav}
      crumbs={['Community Forum']}
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
      <div className="p-6 space-y-6">
        {!selectedThread ? (
          <>
            {/* Categories */}
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold">Categories</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-5 gap-3">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="p-4 rounded-lg border-2 transition text-left"
                    style={{
                      borderColor: selectedCategory === 'all' ? 'var(--cyan)' : 'var(--line-1)',
                      backgroundColor: selectedCategory === 'all' ? 'var(--bg-2)' : 'transparent',
                    }}
                  >
                    <div className="font-medium text-sm mb-1">All Threads</div>
                    <div className="text-xs text-ink-3">
                      {threads.length} threads
                    </div>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="p-4 rounded-lg border-2 transition text-left hover:border-cyan"
                      style={{
                        borderColor: selectedCategory === cat.id ? 'var(--cyan)' : 'var(--line-1)',
                        backgroundColor: selectedCategory === cat.id ? 'var(--bg-2)' : 'transparent',
                      }}
                    >
                      <div className="font-medium text-sm mb-1">{cat.name}</div>
                      <div className="text-xs text-ink-3">
                        {cat.threadCount} threads
                      </div>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Thread List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">
                    {selectedCategory === 'all'
                      ? 'All Discussions'
                      : categories.find(c => c.id === selectedCategory)?.name}
                  </h3>
                  <Button variant="accent">New Thread</Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {filteredThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThread(thread.id)}
                      className="p-4 rounded-lg border border-line-1 hover:bg-bg-2 transition cursor-pointer"
                      style={{ backgroundColor: 'var(--bg-2)' }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {thread.pinned && (
                              <Chip variant="violet" className="text-xs">
                                📌 Pinned
                              </Chip>
                            )}
                            <h4 className="font-medium">{thread.title}</h4>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-ink-3 mt-2">
                            <span>by {thread.author}</span>
                            <span>💬 {thread.replies} replies</span>
                            <span>👁 {thread.views} views</span>
                            <span>Last activity: {thread.lastActivity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-ink-2">
                            {thread.replies}
                          </div>
                          <div className="text-xs text-ink-3">replies</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </>
        ) : (
          <>
            {/* Thread Detail */}
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="default"
                onClick={() => setSelectedThread(null)}
              >
                ← Back
              </Button>
              <h2 className="text-xl font-bold">{selectedThreadData?.title}</h2>
            </div>

            {/* Original Post */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{selectedThreadData?.author}</h4>
                    <p className="text-xs text-ink-3">Original post</p>
                  </div>
                  <Button variant="default" size="sm">Follow</Button>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-ink-1 leading-relaxed mb-4">
                  I'm looking for recommendations on the best delta faucets for commercial bathrooms. We need something that can handle high traffic and frequent use. What has worked well for you all?
                </p>
                <div className="flex items-center gap-4 text-xs text-ink-3">
                  <span>⏰ {selectedThreadData?.lastActivity}</span>
                  <span>👍 Helpful</span>
                  <span>💬 Report</span>
                </div>
              </CardBody>
            </Card>

            {/* Replies */}
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold">
                  {selectedThreadData?.replies} Replies
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="p-4 rounded-lg border border-line-1"
                    style={{ backgroundColor: 'var(--bg-2)' }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{reply.author}</h4>
                        <p className="text-xs text-ink-3">{reply.timestamp}</p>
                      </div>
                      <div className="text-xs text-ink-3">
                        👍 {reply.helpful} helpful
                      </div>
                    </div>
                    <p className="text-sm text-ink-1">{reply.content}</p>
                  </div>
                ))}
              </CardBody>
            </Card>

            {/* Reply Form */}
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold">Add Your Reply</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                {replyForm.errors.content && (
                  <div
                    className="p-3 rounded-lg border border-bad text-sm text-bad"
                    style={{
                      backgroundColor: 'var(--bg-2)',
                      borderColor: 'var(--bad)',
                    }}
                  >
                    {replyForm.errors.content}
                  </div>
                )}
                <textarea
                  {...replyForm.getFieldProps('content')}
                  onBlur={(e) => {
                    replyForm.handleBlur(e);
                  }}
                  placeholder="Share your experience or ask a follow-up question..."
                  className="w-full p-3 rounded-lg border border-line-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-2)',
                    color: 'var(--ink-0)',
                    borderColor: replyForm.errors.content
                      ? 'var(--bad)'
                      : 'var(--line-2)',
                  }}
                  rows={4}
                  disabled={isSubmittingReply}
                />
                <div className="text-xs text-ink-3">
                  {(replyForm.values.content || '').length}/5000 characters
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={(e) => {
                      e.preventDefault();
                      replyForm.handleSubmit(
                        e as any as React.FormEvent<HTMLFormElement>
                      );
                    }}
                    disabled={isSubmittingReply}
                  >
                    {isSubmittingReply ? 'Posting...' : 'Post Reply'}
                  </Button>
                  <Button variant="default" disabled={isSubmittingReply}>
                    Preview
                  </Button>
                </div>
                {replyForm.submitError && (
                  <div
                    className="p-3 rounded-lg border border-bad text-sm text-bad"
                    style={{
                      backgroundColor: 'var(--bg-2)',
                      borderColor: 'var(--bad)',
                    }}
                  >
                    {replyForm.submitError.message}
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default Community;
