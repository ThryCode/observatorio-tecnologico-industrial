import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: 'Enter text...' },
};

export const WithValue: Story = {
  args: { defaultValue: 'Hello World' },
};

export const Password: Story = {
  args: { type: 'password', placeholder: 'Password' },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled input' },
};

export const WithError: Story = {
  render: () => (
    <div className="space-y-1">
      <Input placeholder="Email" className="border-destructive" />
      <p className="text-xs text-destructive">Invalid email address</p>
    </div>
  ),
};
