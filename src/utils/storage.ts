import * as fs from 'fs';
import * as path from 'path';

const DATA_FILE = path.join(__dirname, '../../data/secretsanta.json');

export interface SecretSantaEvent {
  name: string;
  organizer: string;
  participants: string[];
  matches: { [giverId: string]: string };
  active: boolean;
  started: boolean;
}

export interface DataStore {
  [guildId: string]: SecretSantaEvent;
}

export function loadData(): DataStore {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Load data if file exists
    if (fs.existsSync(DATA_FILE)) {
      const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }

  return {};
}

export function saveData(data: DataStore): void {
  try {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving data:', error);
  }
}
