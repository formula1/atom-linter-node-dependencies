# Linter Node Dependencies

#### This lints node dependencies in two forms.
- Lints Files to check if their require statements can be resolved
- Lints Package.json to check if there are unused dependencies.

#### Important not about use.
- This will occur on the entire project whether you like it or not.
  - This is in part to facilitate unused dependencies
  - This also helps when moving folders around for my own personal development
  - I could at some point implement push errors with the new linter class but haven't looked into it enough. This would allow me to only watch files that are relevent to something that is modified and/or create a require tree.
- Relative path requires
  - This does not resolve variables
  - This does not resolve path.resolve
  - This does not resolve concatenation
  - This does resolve plain old strings, the above should be ignored

#### Future

- Settings
  - Include Dev dependencies
  - ignore paths
- Dependency Page
  - Understanding what dependencies are required by modules - http://hughsk.io/disc/ One of my favorite modules ever, disc let me understand how waistful I am with my dependencies.
  - Understanding what modules are requiring a single dependency - This shows us our reliance and dependence on certain modules. Higher the dependence on a few modules, arguably means more maintainable code. The more spread out the modules are, the less likely the code will be maintainable since there will be far more packages you may have to look into.
