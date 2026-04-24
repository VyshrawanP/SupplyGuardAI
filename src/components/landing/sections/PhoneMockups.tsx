import { Cpu, Radio, Users, Download } from 'lucide-react';
import { useEffect, useRef } from 'react';
import rescueImg from '../../../assets/screenshot-rescue.png';
import victimImg from '../../../assets/screenshot-victim.png';
import commandImg from '../../../assets/screenshot-command.png';

import { Reveal } from './Reveal';

const APPS = [
  {
    name: 'Command Center',
    role: 'Operations coordinators',
    icon: <Cpu size={20}/>,
    iconClass: 'phone-mockup__icon--command',
    img: commandImg,
    features: ['Real-time map + hospital tracking', 'Fleet management dashboard', 'Broadcast alerts to all teams'],
    size: '12.4 MB',
    platform: 'Android 8.0+',
  },
  {
    name: 'Rescue Team',
    role: 'Field responders',
    icon: <Radio size={20}/>,
    iconClass: 'phone-mockup__icon--rescue',
    img: rescueImg,
    features: ['Mission assignments + navigation', 'Hospital bed availability', 'Offline maps + CRDT sync'],
    size: '9.8 MB',
    platform: 'Android 8.0+',
  },
  {
    name: 'Victim Report',
    role: 'Affected civilians',
    icon: <Users size={20}/>,
    iconClass: 'phone-mockup__icon--victim',
    img: victimImg,
    features: ['SOS emergency button', 'Needs selector (medical, water, food)', 'Works offline via mesh network'],
    size: '6.2 MB',
    platform: 'Android 7.0+',
  },
];

export function PhoneMockups({ onOpenDownloads }: { onOpenDownloads?: () => void }) {
  return (
    <div className="phone-mockups-grid mt-10">
      {APPS.map((app, i) => (
        <Reveal key={app.name}>
          <div className="phone-mockup-card">
            {/* Phone frame */}
            <div className="phone-frame">
              <div className="phone-frame__notch"/>
              <div className="phone-frame__screen">
                <img src={app.img} alt={`${app.name} app screenshot`} className="phone-frame__screenshot"/>
              </div>
            </div>

            {/* App details */}
            <div className="phone-mockup__details">
              <div className="phone-mockup__header">
                <div className={`phone-mockup__icon ${app.iconClass}`}>{app.icon}</div>
                <div>
                  <h3 className="phone-mockup__name">{app.name}</h3>
                  <p className="phone-mockup__role">{app.role}</p>
                </div>
              </div>

              <ul className="phone-mockup__features">
                {app.features.map(f => <li key={f}>{f}</li>)}
              </ul>

              <div className="phone-mockup__meta">
                <span>{app.size}</span>
                <span>{app.platform}</span>
              </div>

              <button onClick={onOpenDownloads} className="phone-mockup__download">
                <Download size={14}/> Download APK
              </button>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
