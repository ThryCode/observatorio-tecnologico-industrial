import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@/components/ui/badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'danger', 'info', 'gold', 'accent'],
    },
    dot: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: 'Badge' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Destructive' },
};

export const Outline: Story = {
  args: { variant: 'outline', children: 'Outline' },
};

export const Success: Story = {
  args: { variant: 'success', children: 'Success', dot: true },
};

export const Warning: Story = {
  args: { variant: 'warning', children: 'Warning', dot: true },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Danger', dot: true },
};

export const Info: Story = {
  args: { variant: 'info', children: 'Info', dot: true },
};

export const Gold: Story = {
  args: { variant: 'gold', children: 'Gold' },
};

export const Accent: Story = {
  args: { variant: 'accent', children: 'Accent' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success" dot>Success</Badge>
      <Badge variant="warning" dot>Warning</Badge>
      <Badge variant="danger" dot>Danger</Badge>
      <Badge variant="info" dot>Info</Badge>
      <Badge variant="gold">Gold</Badge>
      <Badge variant="accent">Accent</Badge>
    </div>
  ),
};
