import React, { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  PageLayout,
  Modal,
} from '@/components';
import { useAPIMutation } from '@/hooks';
import { useToast } from '@/hooks';
import { useModal } from '@/hooks';
import { useForm } from '@/hooks';
import { CommonValidation } from '@/utils/form';
import { marketplaceAPI } from '@/services/api';

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

interface Contractor {
  id: string;
  name: string;
  bio: string;
  rating: number;
  reviews: number;
  expertise: string[];
  verified: boolean;
  hourlyRate: number;
  completedJobs: number;
  avatar?: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  count: number;
  icon: string;
}

interface Order {
  id: string;
  contractor: string;
  service: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  amount: number;
  date: string;
}

export const Marketplace: React.FC = () => {
  const [activeNav, setActiveNav] = useState('marketplace');
  const [viewMode, setViewMode] = useState<'home' | 'contractors' | 'orders'>('home');
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const { isOpen: isMessageOpen, open: openMessage, close: closeMessage } = useModal();
  const { isOpen: isHireOpen, open: openHire, close: closeHire } = useModal();
  const { addToast } = useToast();

  const { execute: sendMessage } = useAPIMutation(
    (data: { contractorId: string; message: string }) =>
      Promise.resolve() // Placeholder for actual API call
  );

  const { execute: createOrder } = useAPIMutation(
    (data: { contractorId: string; serviceId: string; details: string }) =>
      marketplaceAPI.createOrder(data)
  );

  const messageForm = useForm({
    initialValues: { message: '' },
    validationSchema: {
      message: [
        CommonValidation.required('Please enter a message'),
        CommonValidation.minLength(5, 'Message must be at least 5 characters'),
      ],
    },
    onSubmit: async (values) => {
      if (!selectedContractor) return;
      try {
        await sendMessage({
          contractorId: selectedContractor.id,
          message: values.message,
        });
        messageForm.resetForm();
        closeMessage();
        addToast({
          type: 'success',
          message: 'Message sent successfully',
          duration: 3000,
        });
      } catch (error) {
        addToast({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to send message',
          duration: 4000,
        });
      }
    },
  });

  const hireForm = useForm({
    initialValues: { service: '', hours: '1', details: '' },
    validationSchema: {
      service: [CommonValidation.required('Please select a service')],
      hours: [CommonValidation.required('Please enter hours')],
      details: [
        CommonValidation.required('Please enter project details'),
        CommonValidation.minLength(10, 'Details must be at least 10 characters'),
      ],
    },
    onSubmit: async (values) => {
      if (!selectedContractor) return;
      try {
        await createOrder({
          contractorId: selectedContractor.id,
          serviceId: values.service,
          details: values.details,
        });
        hireForm.resetForm();
        closeHire();
        addToast({
          type: 'success',
          message: 'Order created successfully',
          duration: 3000,
        });
      } catch (error) {
        addToast({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to create order',
          duration: 4000,
        });
      }
    },
  });

  const [contractors] = useState<Contractor[]>([
    {
      id: '1',
      name: 'Alex Chen',
      bio: 'Certified plumber with 12 years experience in commercial installations',
      rating: 4.9,
      reviews: 287,
      expertise: ['Installation', 'Repair', 'Commercial'],
      verified: true,
      hourlyRate: 85,
      completedJobs: 523,
    },
    {
      id: '2',
      name: 'Sarah Martinez',
      bio: 'Specialist in bathroom renovations and fixture upgrades',
      rating: 4.8,
      reviews: 156,
      expertise: ['Renovation', 'Fixtures', 'Design'],
      verified: true,
      hourlyRate: 95,
      completedJobs: 312,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      bio: 'Expert in industrial water systems and bulk installations',
      rating: 4.7,
      reviews: 89,
      expertise: ['Industrial', 'Bulk Orders', 'Maintenance'],
      verified: true,
      hourlyRate: 75,
      completedJobs: 201,
    },
  ]);

  const [services] = useState<Service[]>([
    { id: '1', name: 'Installation', category: 'setup', count: 1247, icon: '🔧' },
    { id: '2', name: 'Repair', category: 'maintenance', count: 856, icon: '🔨' },
    { id: '3', name: 'Consultation', category: 'advising', count: 423, icon: '💡' },
    { id: '4', name: 'Renovation', category: 'upgrade', count: 634, icon: '✨' },
    { id: '5', name: 'Inspection', category: 'audit', count: 512, icon: '🔍' },
    { id: '6', name: 'Training', category: 'education', count: 189, icon: '📚' },
  ]);

  const [orders] = useState<Order[]>([
    {
      id: '1',
      contractor: 'Alex Chen',
      service: 'Bathroom Fixture Installation',
      status: 'in_progress',
      amount: 1850,
      date: '2026-05-10',
    },
    {
      id: '2',
      contractor: 'Sarah Martinez',
      service: 'Commercial Kitchen Upgrade',
      status: 'completed',
      amount: 3200,
      date: '2026-05-08',
    },
    {
      id: '3',
      contractor: 'Mike Johnson',
      service: 'Bulk System Installation',
      status: 'pending',
      amount: 8500,
      date: '2026-05-12',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'ok';
      case 'in_progress':
        return 'cyan';
      case 'pending':
        return 'warn';
      case 'cancelled':
        return 'bad';
      default:
        return 'cyan';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <PageLayout
      active={activeNav}
      navItems={NAV_ITEMS}
      onNavigate={setActiveNav}
      crumbs={['Marketplace']}
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
        {/* View Switcher */}
        <div className="flex gap-3">
          <Button
            variant={viewMode === 'home' ? 'primary' : 'default'}
            onClick={() => setViewMode('home')}
          >
            Marketplace
          </Button>
          <Button
            variant={viewMode === 'contractors' ? 'primary' : 'default'}
            onClick={() => setViewMode('contractors')}
          >
            Contractors
          </Button>
          <Button
            variant={viewMode === 'orders' ? 'primary' : 'default'}
            onClick={() => setViewMode('orders')}
          >
            My Orders
          </Button>
        </div>

        {/* Marketplace Home */}
        {viewMode === 'home' && (
          <div className="space-y-6">
            {/* Services Grid */}
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold">Available Services</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-3 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 rounded-lg border border-line-1 hover:bg-bg-2 transition cursor-pointer"
                      style={{ backgroundColor: 'var(--bg-2)' }}
                    >
                      <div className="text-3xl mb-2">{service.icon}</div>
                      <h4 className="font-medium text-sm mb-1">{service.name}</h4>
                      <p className="text-xs text-ink-3">{service.count} available</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Featured Contractors */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Top Rated Contractors</h3>
                  <Button variant="accent" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {contractors.slice(0, 3).map((contractor) => (
                  <div
                    key={contractor.id}
                    className="p-4 rounded-lg border border-line-1"
                    style={{ backgroundColor: 'var(--bg-2)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{contractor.name}</h4>
                          {contractor.verified && (
                            <Chip variant="ok" className="text-xs">✓ Verified</Chip>
                          )}
                        </div>
                        <p className="text-sm text-ink-2 mb-2">{contractor.bio}</p>
                        <div className="flex items-center gap-4 text-xs text-ink-3 mb-3">
                          <span>⭐ {contractor.rating} ({contractor.reviews} reviews)</span>
                          <span>${contractor.hourlyRate}/hr</span>
                          <span>{contractor.completedJobs} completed</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {contractor.expertise.map((exp) => (
                            <Chip key={exp} variant="cyan" className="text-xs">
                              {exp}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="accent"
                        onClick={() => {
                          setSelectedContractor(contractor);
                          openHire();
                        }}
                      >
                        Hire
                      </Button>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Contractors List */}
        {viewMode === 'contractors' && (
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">All Contractors</h3>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line-2">
                      <th className="text-left py-3 px-4 font-semibold text-ink-2">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-ink-2">
                        Expertise
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-ink-2">
                        Rating
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-2">
                        Rate
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-2">
                        Jobs
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-ink-2">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractors.map((contractor, idx) => (
                      <tr key={idx} className="border-b border-line-1 hover:bg-bg-2 transition">
                        <td className="py-3 px-4 font-medium">{contractor.name}</td>
                        <td className="py-3 px-4 text-ink-2">
                          {contractor.expertise.join(', ')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          ⭐ {contractor.rating}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          ${contractor.hourlyRate}/hr
                        </td>
                        <td className="py-3 px-4 text-right text-ink-2">
                          {contractor.completedJobs}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedContractor(contractor);
                              openMessage();
                            }}
                          >
                            Message
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Orders List */}
        {viewMode === 'orders' && (
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">My Orders</h3>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line-2">
                      <th className="text-left py-3 px-4 font-semibold text-ink-2">
                        Contractor
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-ink-2">
                        Service
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-ink-2">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-2">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-ink-2">
                        Date
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-ink-2">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, idx) => (
                      <tr key={idx} className="border-b border-line-1 hover:bg-bg-2 transition">
                        <td className="py-3 px-4 font-medium">{order.contractor}</td>
                        <td className="py-3 px-4 text-ink-2">{order.service}</td>
                        <td className="py-3 px-4 text-center">
                          <Chip
                            variant={getStatusColor(order.status) as any}
                            className="text-xs"
                          >
                            {getStatusLabel(order.status)}
                          </Chip>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          ${order.amount}
                        </td>
                        <td className="py-3 px-4 text-ink-2">{order.date}</td>
                        <td className="py-3 px-4 text-center">
                          <Button size="sm">Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Message Modal */}
        <Modal
          isOpen={isMessageOpen}
          onClose={closeMessage}
          title={`Message ${selectedContractor?.name}`}
          size="md"
        >
          <form
            onSubmit={(e: any) => {
              e.preventDefault();
              messageForm.handleSubmit(e);
            }}
            className="space-y-4"
          >
            {messageForm.errors.message && (
              <div
                className="p-3 rounded-lg border border-bad text-sm text-bad"
                style={{
                  backgroundColor: 'var(--bg-2)',
                  borderColor: 'var(--bad)',
                }}
              >
                {messageForm.errors.message}
              </div>
            )}
            <textarea
              {...messageForm.getFieldProps('message')}
              onBlur={(e) => messageForm.handleBlur(e)}
              placeholder="Type your message..."
              className="w-full p-3 rounded-lg border border-line-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-2)',
                color: 'var(--ink-0)',
                borderColor: messageForm.errors.message
                  ? 'var(--bad)'
                  : 'var(--line-2)',
              }}
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="default"
                onClick={closeMessage}
                disabled={messageForm.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={messageForm.isSubmitting}
              >
                {messageForm.isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Hire Modal */}
        <Modal
          isOpen={isHireOpen}
          onClose={closeHire}
          title={`Hire ${selectedContractor?.name}`}
          size="md"
        >
          <form
            onSubmit={(e: any) => {
              e.preventDefault();
              hireForm.handleSubmit(e);
            }}
            className="space-y-4"
          >
            {hireForm.submitError && (
              <div
                className="p-3 rounded-lg border border-bad text-sm text-bad"
                style={{
                  backgroundColor: 'var(--bg-2)',
                  borderColor: 'var(--bad)',
                }}
              >
                {hireForm.submitError.message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Service</label>
              <select
                {...hireForm.getFieldProps('service')}
                className="w-full px-3 py-2 rounded-lg border border-line-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-2)',
                  color: 'var(--ink-0)',
                  borderColor: hireForm.errors.service
                    ? 'var(--bad)'
                    : 'var(--line-2)',
                }}
              >
                <option value="">Select a service...</option>
                <option value="installation">Installation</option>
                <option value="repair">Repair</option>
                <option value="consultation">Consultation</option>
                <option value="renovation">Renovation</option>
              </select>
              {hireForm.errors.service && (
                <p className="text-xs text-bad mt-1">{hireForm.errors.service}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hours Needed</label>
              <input
                type="number"
                {...hireForm.getFieldProps('hours')}
                className="w-full px-3 py-2 rounded-lg border border-line-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-2)',
                  color: 'var(--ink-0)',
                  borderColor: 'var(--line-2)',
                }}
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project Details</label>
              <textarea
                {...hireForm.getFieldProps('details')}
                onBlur={(e) => hireForm.handleBlur(e)}
                placeholder="Describe the work you need..."
                className="w-full p-3 rounded-lg border border-line-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-2)',
                  color: 'var(--ink-0)',
                  borderColor: hireForm.errors.details
                    ? 'var(--bad)'
                    : 'var(--line-2)',
                }}
                rows={4}
              />
              {hireForm.errors.details && (
                <p className="text-xs text-bad mt-1">{hireForm.errors.details}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="default"
                onClick={closeHire}
                disabled={hireForm.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={hireForm.isSubmitting}
              >
                {hireForm.isSubmitting ? 'Creating Order...' : 'Create Order'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageLayout>
  );
};

export default Marketplace;
