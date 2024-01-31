The Node.js Philosophy
Small Modules 
Small is beautiful
Make each programme do one thing well
Small Surface Area
to being small in size and scope, modules exposing a minimal set of functionalities to the outside world ( this has the effect of producing an API that is clearer to use and less susceptible to erroneous usage
Simplicity and Pragmatism
Keep It Simple, Stupid (KISS): The design must be simple, both in implemenation and interface. It more importan for the implementation to be simple than the interface. Simplicity is the most important consideration in a design
How Node.js Works
I/o is slow, --> blocking i/o (multithread, more idle thread)
Non-blocking I/O
most moderen OS support this as they return immediately without waiting for the data to be read or written
The most basic pattern is Busy-waiting 
resources = [socketA, socketB, fileA]
while (!resources.isEmpty()) {
for (resource of resources) {
// try to read
data = resource.read()
if (data === NO_DATA_AVAILABLE) {
      // there is no data to read at the moment
continue
    }
    if (data === RESOURCE_CLOSED) {
      // the resource was closed, remove it from the list
      resources.remove(i)
    } else {
      //some data was received, process it
      consumeData(data)
    }
} }
As you can see, with this simple technique, it is possible to handle different resources in the same thread, but it's still not efficient. In fact, in the preceding example, the loop will only consume precious CPU for iterating over resources that are unavailable most of the time. Polling algorithms usually result in a huge amount of wasted CPU time.
Event Demultiplexing
Most modern OS provide a native mechanism to handle concurrent non-blocking resources in an efficient way(i.e. Synchronous event Demultiplexer also known as the event notification interface) 
If you are unfamiliar with the term, in telecommunications, multiplexing refers to the method by which multiple signals are combined into one so that they can be easily transmitted over a medium with limited capacity.
Demultiplexing refers to the opposite operation, whereby the signal is split again into its original components. Both terms are used in other areas (for example, video processing) to describe the general operation of combining different things into one and vice versa.
The synchronous event demultiplexer that we were talking about watches multiple resources and returns a new event (or set of events) when a read or write operation executed over one of those resources completes. The advantage here is that the synchronous event demultiplexer is, of course, synchronous, so it blocks until there are new events to process. The following is the pseudocode of an algorithm that uses a generic synchronous event demultiplexer to read from two different resources:
watchedList.add(socketA, FOR_READ)
watchedList.add(fileB, FOR_READ)
while (events = demultiplexer.watch(watchedList)) {
// event loop
for (event of events) {
// This read will never block and will always return data data = event.resource.read()
if (data === RESOURCE_CLOSED) {
// (1)
// (2)
// (3)
      // the resource was closed, remove it from the watched list
      demultiplexer.unwatch(event.resource)
    } else {
      // some actual data was received, process it
      consumeData(data)
    }
} }
The resources are added to a data structure, associating each one of them
with a specific operation (in our example, a read).
The demultiplexer is set up with the group of resources to be watched.
The call to demultiplexer.watch() is synchronous and blocks until
any of the watched resources are ready for read. When this occurs, the
event demultiplexer returns from the call and a new set of events is available to be processed
Each event returned by the event demultiplexer is processed. At this point, the resource associated with each event is guaranteed to be ready to read and to not block during the operation. When all the events are processed, the flow will block again on the event demultiplexer until new events are again available to be processed. This is called the event loop.
It's interesting to see that, with this pattern, we can now handle several I/O operations inside a single thread, without using the busy-waiting technique. It should now be clearer why we are talking about demultiplexing; using just a single thread, we can deal with multiple resources. Figure 1.2 will help you visualize what's happening in a web server that uses a synchronous event demultiplexer and a single thread to handle multiple concurrent connections:


This has the clear advantage of minimizing the total idle time of the thread
The Reactor Pattern
Reactor Pattern is a specialization of the algorithms presented of Event Demultiplexer. The main idea behind the reactor pattern is to have handler associated with each I/O operation(a handle in Node.js is represented by a callback function). The handler will be invoked as soon as an event is produced and processed by the event loop. 

This is what happens in an application using the reactor pattern:
The application generates a new I/O operation by submitting a request to the Event Demultiplexer. The application also specifies a handler, which will be invoked when the operation completes. Submitting a new request
to the Event Demultiplexer is a non-blocking call and it immediately returns control to the application.
When a set of I/O operations completes, the Event Demultiplexer pushes a set of corresponding events into the Event Queue.
At this point, the Event Loop iterates over the items of the Event Queue.
For each event, the associated handler is invoked.
The handler, which is part of the application code, gives back control
to the Event Loop when its execution completes (5a). While the handler executes, it can request new asynchronous operations (5b), causing new items to be added to the Event Demultiplexer (1).
When all the items in the Event Queue are processed, the Event Loop blocks again on the Event Demultiplexer, which then triggers another cycle when a new event is available.
The asynchronous behavior has now become clear. 
The application expresses interest in accessing a resource at one point in time (without blocking) and provides a handler, which will then be invoked at another point in time when the operation completes.
A Node.js application will exit when there are no more pending operations in the event demultiplexer, and no more events to be processed inside the event queue.
The reactor pattern (The pattern at the heart of Node.js)
Handles I/O by blocking until new events are available from a set of observed resources, and then reacts by dispatching each event to an associated handler.
Libuv, the I/O engine of Node.js
Each operating system has its own interface for the event demultiplexer: epoll on Linux, kqueue on macOS, and the I/O completion port (IOCP) API on Windows. 
On top of that, each I/O operation can behave quite differently depending on the type
of resource, even within the same operating system. In Unix operating systems, for example, regular filesystem files do not support non-blocking operations, so in order to simulate non-blocking behavior, it is necessary to use a separate thread outside the event loop.
All these inconsistencies across and within the different operating systems required
a higher-level abstraction to be built for the event demultiplexer. This is exactly why the Node.js core team created a native library called libuv, with the objective to make Node.js compatible with all the major operating systems and normalize the non- blocking behavior of the different types of resource. Libuv represents the low-level I/O engine of Node.js and is probably the most important component that Node.js is built on.
Other than abstracting the underlying system calls, libuv also implements the reactor pattern, thus providing an API for creating event loops, managing the event queue, running asynchronous I/O operations, and queuing other types of task.
The recipe for Node.js
Reactor pattern
libuv
A set of bindings responsible for wrapping and exposing libuv and other low-level functionalities to JavaScript.
V8, the JavaScript engine originally developed by Google for the Chrome browser. This is one of the reasons why Node.js is so fast and efficient. V8 is acclaimed for its revolutionary design, its speed, and for its efficient memory management.
A core JavaScript library that implements the high-level Node.js API.

Javascript in Node.js
 Node.js we don't have a DOM and we don't have a window or a document.
Node.js we don't have a DOM and we don't have a window or a document. On the other hand, Node.js has access to a set of services offered by the underlying operating system that are not available in the browser.
Node.js we can virtually have access to all the services exposed by the operating system.
Node.js ships with very recent versions of V8, means that we can use with confidence most of the features of the latest ECMAScript specification (ES for short; this is the standard on which the JavaScript language is based) without the need for any extra transpilation step.
Full access to operating system services
we can access any file on the filesystem (subject to any operating system-level permission) thanks to the fs module
we can write applications that use low-level TCP or UDP sockets thanks to the net and dgram modules
We can create HTTP(S) servers (with the http and https modules)
use the standard encryption and hashing algorithms of OpenSSL (with the crypto module)
We can also access some of the V8 internals (the v8 module) or run code in a different V8 context (with the vm module).
We can also run other processes (with the child_process module) or retrieve our own application's process information using the process global variable.
In particular, from the process global variable, we can get a list of the environment variables assigned to the process (with process.env) or the command-line arguments passed to the application at the moment of its launch (with process.argv).
Running native code
One of the most powerful capabilities offered by Node.js is certainly the possibility to create userland modules that can bind to native code. This gives to the platform a tremendous advantage as it allows us to reuse existing or new components written in C/C++. Node.js officially provides great support for implementing native modules thanks to the N-API interface
it allows us to reuse with little effort a vast amount of existing open source libraries, and most importantly, it allows a company to reuse its own C/C++ legacy code without the need to migrate it.
Another important consideration is that native code is still necessary to access low-level features such as communicating with hardware drivers or with hardware ports (for example, USB or serial). In fact, thanks to its ability to link to native code, Node.js has become popular in the world of the Internet of things (IoT) and homemade robotics.
even though V8 is very (very) fast at executing JavaScript, it still has a performance penalty to pay compared to executing native code. In everyday computing, this is rarely an issue, but for CPU-intensive applications, such as those with a lot of data processing and manipulation, delegating the work to native code can make tons of sense.
We should also mention that, nowadays, most JavaScript virtual machines (VMs) (and also Node.js) support WebAssembly (Wasm), a low-level instruction format that allows us to compile languages other than JavaScript (such as C++ or Rust) into a format that is "understandable" by JavaScript VMs. This brings many of the advantages we have mentioned, without the need to directly interface with native code. nodejsdp.link/webassembly
