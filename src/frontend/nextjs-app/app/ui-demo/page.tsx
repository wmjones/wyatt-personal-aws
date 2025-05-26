'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  LoadingState,
  ErrorState,
  EmptyState,
  SingleSelectDropdown,
  MultiSelectDropdown,
  type DropdownOption,
} from '@/components/ui';

const sampleOptions: DropdownOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry', disabled: true },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
  { value: 'honeydew', label: 'Honeydew' },
];

const groupedOptions: DropdownOption[] = [
  { value: 'us-east', label: 'US East', group: 'Americas' },
  { value: 'us-west', label: 'US West', group: 'Americas' },
  { value: 'canada', label: 'Canada', group: 'Americas' },
  { value: 'uk', label: 'United Kingdom', group: 'Europe' },
  { value: 'germany', label: 'Germany', group: 'Europe' },
  { value: 'france', label: 'France', group: 'Europe' },
  { value: 'japan', label: 'Japan', group: 'Asia' },
  { value: 'china', label: 'China', group: 'Asia' },
];

export default function UIDemo() {
  const [singleValue, setSingleValue] = useState<string>();
  const [multiValue, setMultiValue] = useState<string[]>([]);

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">UI Component Library Demo</h1>

      {/* Buttons Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <Card padding="lg">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">Tertiary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button fullWidth>Full Width</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Dropdown Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Dropdowns</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg">
            <h3 className="text-lg font-medium mb-4">Single Select</h3>
            <div className="space-y-4">
              <SingleSelectDropdown
                options={sampleOptions}
                value={singleValue}
                onChange={setSingleValue}
                placeholder="Select a fruit"
              />

              <SingleSelectDropdown
                options={groupedOptions}
                value={singleValue}
                onChange={setSingleValue}
                placeholder="Select a region"
                searchable={false}
              />

              <SingleSelectDropdown
                options={sampleOptions}
                value={singleValue}
                onChange={setSingleValue}
                placeholder="With error"
                error="This field is required"
              />

              <SingleSelectDropdown
                options={sampleOptions}
                value={singleValue}
                onChange={setSingleValue}
                placeholder="Disabled"
                disabled
              />
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-lg font-medium mb-4">Multi Select</h3>
            <div className="space-y-4">
              <MultiSelectDropdown
                options={sampleOptions}
                value={multiValue}
                onChange={setMultiValue}
                placeholder="Select fruits"
              />

              <MultiSelectDropdown
                options={sampleOptions}
                value={multiValue}
                onChange={setMultiValue}
                placeholder="Max 3 selections"
                maxSelections={3}
              />

              <MultiSelectDropdown
                options={groupedOptions}
                value={multiValue}
                onChange={setMultiValue}
                placeholder="Select regions"
                searchable={false}
              />

              <MultiSelectDropdown
                options={sampleOptions}
                value={multiValue}
                onChange={setMultiValue}
                placeholder="Loading state"
                loading
              />
            </div>
          </Card>
        </div>
      </section>

      {/* Feedback Components Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Feedback Components</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <LoadingState message="Loading data..." />
          </Card>

          <Card>
            <ErrorState
              message="Failed to load data"
              action={{
                label: "Retry",
                onClick: () => {
                  console.log('Retry clicked');
                }
              }}
            />
          </Card>

          <Card>
            <EmptyState
              title="No results"
              message="Try adjusting your filters"
              action={{
                label: "Clear filters",
                onClick: () => {
                  setSingleValue(undefined);
                  setMultiValue([]);
                }
              }}
            />
          </Card>
        </div>
      </section>

      {/* Card Variants Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Cards</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="sm">
            <h3 className="font-medium mb-2">Small Padding</h3>
            <p className="text-dp-text-secondary">This card has small padding.</p>
          </Card>

          <Card padding="md">
            <h3 className="font-medium mb-2">Medium Padding</h3>
            <p className="text-dp-text-secondary">This card has medium padding.</p>
          </Card>

          <Card padding="lg" variant="elevated">
            <h3 className="font-medium mb-2">Elevated Large</h3>
            <p className="text-dp-text-secondary">This card is elevated with large padding.</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
