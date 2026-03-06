import * as dataController from './controllers/dataController.js';
console.log('Available exports:', Object.keys(dataController));
if (dataController.localJSONBackup) {
    console.log('SUCCESS: localJSONBackup is exported');
} else {
    console.log('FAILURE: localJSONBackup is NOT exported');
}
