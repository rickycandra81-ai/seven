// The canvas downloads a JSON file through an anchor and restores through a file
// input. On device the equivalents are the share sheet and the document picker:
// same file, same shape, so a backup moves between the web canvas and the app.

import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export interface BackupEnvelope {
  app: 'seven';
  v: 4;
  at: string;
  data: Record<string, unknown>;
}

function stamp(): string {
  const d = new Date();
  return (
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  );
}

// returns the file name on success, so the caller can report it
export async function writeBackup(data: Record<string, unknown>): Promise<string> {
  const envelope: BackupEnvelope = { app: 'seven', v: 4, at: new Date().toISOString(), data };
  const name = 'seven-backup-' + stamp() + '.json';
  const dir = new Directory(Paths.cache, 'backup');
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, name);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(envelope, null, 1));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Seven backup' });
  }
  return name;
}

// null = the user cancelled, or the file was not a Seven backup
export async function readBackup(): Promise<Record<string, unknown> | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets || !res.assets.length) return null;
  let envelope: BackupEnvelope;
  try {
    envelope = JSON.parse(await new File(res.assets[0].uri).text());
  } catch (e) {
    Alert.alert('Restore failed', 'That file could not be read.');
    return null;
  }
  if (!envelope || envelope.app !== 'seven' || !envelope.data) {
    Alert.alert('Restore failed', 'That file is not a Seven backup.');
    return null;
  }
  const when = (envelope.at || '').slice(0, 10);
  const ok = await new Promise<boolean>((resolve) =>
    Alert.alert(
      'Replace everything?',
      'Replace everything on this device with the backup from ' + when + '?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Replace', style: 'destructive', onPress: () => resolve(true) },
      ],
      { onDismiss: () => resolve(false) }
    )
  );
  return ok ? envelope.data : null;
}
