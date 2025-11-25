// Простой скрипт для инициализации Replica Set
// Использует встроенный драйвер MongoDB

const { MongoClient } = require('mongodb');

// Используем directConnection для подключения к узлу до инициализации replica set
const uri = 'mongodb://localhost:27017/?directConnection=true';
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
});

async function initReplica() {
  try {
    console.log('🔄 Подключение к MongoDB...');
    await client.connect();
    console.log('✅ Подключено');

    const admin = client.db().admin();

    // Проверяем текущий статус
    try {
      const status = await admin.command({ replSetGetStatus: 1 });
      console.log('✅ Replica Set уже настроен!');
      console.log('Статус:', status.set);
      return;
    } catch (e) {
      if (e.message.includes('no replset config')) {
        console.log('🔄 Инициализация Replica Set...');
        
        const result = await admin.command({
          replSetInitiate: {
            _id: 'rs0',
            members: [{ _id: 0, host: 'localhost:27017' }]
          }
        });
        
        console.log('✅ Replica Set инициализирован!');
        console.log('⏳ Подождите 10-15 секунд...');
        console.log('Результат:', JSON.stringify(result, null, 2));
      } else {
        throw e;
      }
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    
    if (error.message.includes('Server selection timed out')) {
      console.log('\n💡 MongoDB не отвечает. Проверьте:');
      console.log('   1. MongoDB запущен?');
      console.log('   2. Порт 27017 доступен?');
      console.log('   3. В mongod.cfg добавлена секция replication?');
    } else if (error.message.includes('not running with --replSet')) {
      console.log('\n💡 MongoDB не запущен с параметром --replSet');
      console.log('   Убедитесь, что в mongod.cfg есть:');
      console.log('   replication:');
      console.log('     replSetName: "rs0"');
      console.log('   Затем перезапустите MongoDB');
    }
  } finally {
    await client.close();
  }
}

initReplica();

