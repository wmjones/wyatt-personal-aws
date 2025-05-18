import React from 'react';
import MarqueeText from './MarqueeText';
// Removing unused Button import
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const HomePage: React.FC = () => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16">
        <div className="order-2 md:order-1">
          <div className="space-y-6">
            <h2 className="retro-text text-3xl text-retro-teal">Data Visualization</h2>
            <p className="mono-text">
              Experience interactive data visualization with our retro-inspired dashboard.
              Explore statistical distributions with real-time parameter controls.
            </p>
            <div className="flex gap-4">
              <a href="/demo" className="retro-button">
                Try Demo
              </a>
              <a href="/about" className="bg-white text-retro-purple font-bold py-2 px-4 border-2 border-black hover:bg-gray-100">
                About
              </a>
            </div>

            <div className="border-2 border-dashed border-retro-pink p-4 bg-white">
              <p className="mono-text text-sm">
                <span className="text-retro-purple font-bold">&lt;NEW&gt;</span>
                Interactive normal distribution visualization with parameter controls!
                <span className="text-retro-purple font-bold">&lt;/NEW&gt;</span>
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="retro-card p-6">
            <h3 className="retro-text text-2xl mb-4 text-center text-retro-purple">FEATURES</h3>
            <ul className="space-y-2 mono-text">
              <li className="flex items-start">
                <span className="text-retro-teal mr-2">→</span>
                <span>Interactive parameter controls</span>
              </li>
              <li className="flex items-start">
                <span className="text-retro-teal mr-2">→</span>
                <span>Real-time visualization updates</span>
              </li>
              <li className="flex items-start">
                <span className="text-retro-teal mr-2">→</span>
                <span>Statistical insights</span>
              </li>
              <li className="flex items-start">
                <span className="text-retro-teal mr-2">→</span>
                <span>WebSocket real-time collaboration</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <MarqueeText text="⚡ D3 VISUALIZATION DASHBOARD ⚡ INTERACTIVE DATA EXPLORATION ⚡ REAL-TIME COLLABORATION ⚡" />

      <div className="my-16">
        <h2 className="retro-text text-3xl text-retro-teal mb-8 text-center">PROJECT STATUS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard title="REACT SPA" status="deployed" text="Deployed and working" />
          <StatusCard title="DYNAMODB" status="deployed" text="Deployed and ready" />
          <StatusCard title="USER AUTH" status="in-progress" text="In development" />
          <StatusCard title="VISUALIZATIONS" status="in-progress" text="See Demo page" />
        </div>
      </div>

      <div className="my-16">
        <h2 className="retro-text text-3xl text-retro-teal mb-8 text-center">DYNAMODB INFRASTRUCTURE</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card retro className="p-4">
            <CardHeader className="pb-2">
              <CardTitle className="retro-text text-xl text-retro-purple">PARAMETER TABLE</CardTitle>
            </CardHeader>
            <CardContent className="mono-text text-sm">
              <p className="mb-2"><strong>Purpose:</strong> Stores visualization parameters</p>
              <p className="mb-1"><strong>Features:</strong></p>
              <ul className="pl-5 space-y-1 list-disc">
                <li>Partition key: paramId</li>
                <li>Sort key: timestamp</li>
                <li>GSI: UserIdIndex</li>
                <li>Version tracking</li>
              </ul>
            </CardContent>
          </Card>

          <Card retro className="p-4">
            <CardHeader className="pb-2">
              <CardTitle className="retro-text text-xl text-retro-purple">HISTORY TABLE</CardTitle>
            </CardHeader>
            <CardContent className="mono-text text-sm">
              <p className="mb-2"><strong>Purpose:</strong> Tracks parameter changes</p>
              <p className="mb-1"><strong>Features:</strong></p>
              <ul className="pl-5 space-y-1 list-disc">
                <li>Partition key: userId</li>
                <li>Sort key: timestamp</li>
                <li>GSIs: ParamNameIndex + ParamIdIndex</li>
                <li>Value change tracking</li>
              </ul>
            </CardContent>
          </Card>

          <Card retro className="p-4">
            <CardHeader className="pb-2">
              <CardTitle className="retro-text text-xl text-retro-purple">CONNECTION TABLE</CardTitle>
            </CardHeader>
            <CardContent className="mono-text text-sm">
              <p className="mb-2"><strong>Purpose:</strong> Manages WebSocket connections</p>
              <p className="mb-1"><strong>Features:</strong></p>
              <ul className="pl-5 space-y-1 list-disc">
                <li>Partition key: connectionId</li>
                <li>GSI: UserConnectionsIndex</li>
                <li>TTL: Auto-cleanup of stale connections</li>
                <li>Real-time collaboration support</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mt-10">
          <a href="/demo" className="retro-button">
            TRY THE DEMO
          </a>
        </div>
      </div>

      <div className="my-16">
        <h2 className="retro-text text-3xl text-retro-teal mb-8 text-center">WHY CHOOSE US</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['VISUALIZE', 'ANALYZE', 'COLLABORATE'].map((item, i) => (
            <div key={i} className="retro-card p-6 text-center">
              <h3 className="retro-text text-2xl mb-3 text-retro-purple">{item}</h3>
              <p className="mono-text text-sm">
                {item === 'VISUALIZE' && 'Create and customize statistical visualizations with intuitive controls.'}
                {item === 'ANALYZE' && 'Explore data patterns and distributions with interactive parameters.'}
                {item === 'COLLABORATE' && 'Share and update visualizations in real-time with WebSocket support.'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface StatusCardProps {
  title: string;
  status: 'deployed' | 'in-progress' | 'planned';
  text: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, status, text }) => {
  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-3 h-3 rounded-full ${
          status === 'deployed' ? 'bg-retro-teal' :
          status === 'in-progress' ? 'bg-retro-yellow' :
          'bg-gray-300'
        }`}></div>
        <h3 className="retro-text text-xl text-retro-purple">{title}</h3>
      </div>
      <p className="mono-text text-sm">{text}</p>
    </div>
  );
};

export default HomePage;
