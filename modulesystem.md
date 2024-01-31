The revealing Module Pattern 
The Javascript is lacking its naming system, which makes it risky to global scope pollution. But this problem can be solve by Revealing module pattern which is generic pattern. 
```javascript
const myModule = (()=> {
    const myPrivateFoo = () => {};
    const myPrivateBar = [];
    const exported ={
        publicFoo: ()=> {}, 
        publicBar: () => {}
    };
    return exported;
})();// once the parenthesis here are parsed, the function will be invoked
console.log(myModule);
console.log(myModule.privateFoo,myModule.privateBar);
```
This pattern leverages a self-invoking function. This type of function is sometimes also referred to as Immediately Invoked Function Expression (IIFE) and it is used to create a private scope, exporting only the parts that are meant to be public.
This pattern is essentially exploiting these properties to keep the private information hidden and export only a public-facing API.
In the preceding code, the myModule variable contains only the exported API, while the rest of the module content is practically inaccessible from outside. The idea behind this pattern is used as a base for the commonJS modules.
