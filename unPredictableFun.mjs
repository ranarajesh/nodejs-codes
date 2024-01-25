// One of the most dangerous situations is to have an API that behaves synchronously under certain conditions and asynchronously under others.
import { read, readFile, readFileSync } from 'fs';
const cache = new Map();

function inconsistentRead(fileName, cb) {
    if(cache.has(fileName)){ 
        // Invoked synchronously  
        cb(cache.get(fileName));
    }else{
        // asynchronous function
        readFile(fileName, 'utf-8', (err, data) =>{
            cache.set(fileName, data);
            cb(data);
        })
    }
}

// The preceding function uses the cache map to store the results of different file read operations. Bear in mind that this is just an example; it does not have error management, and the caching logic itself is suboptimal. But besides all this, the preceding function is dangerous because it behaves asynchronously until the file is read for the first time and the cache is set, but it is synchronous for all the subsequent requests once the file's content is already in the cache.

// Unleashing Zalgo
function createFileReader(fileName) {
    const listeners = [];
    inconsistentRead(fileName, value=> {
        listeners.forEach(listener => listener(value) )
    })
    return{
        onDataReady: listener => listeners.push(listener)
    }
}

function consistentReadSync (filename) {
    if (cache.has(filename)) {
      return cache.get(filename)
    } else {
      const data = readFileSync(filename, 'utf8')
      cache.set(filename, data)
      return data
  } }

function consistentReadAsync(fileName, cb) {
    if(cache.has(fileName)){
        // deferred callback invocation
        process.nextTick( () => cb(cache.get(fileName)))
    }else{
        // asynchronous function
        readFile(fileName, 'utf-8', (err, data)=>{
            cache.set(fileName, data);
            cb(data);
        })
    }
}

const reader1 = createFileReader('README.md');
reader1.onDataReady( data => {
    console.log(`first call data : ${data}`);
    // ...sometime later we try to read again from 
    // the same file
    const reader2 = createFileReader('README.md');
    reader2.onDataReady(data => {
        console.log(`Second call data: ${data}`);
    })
})
