# Cigar Nexus Logos

Place official logo files here (transparent background preferred).

Do not generate fake logos, gold wordmarks, or placeholder art. If there is no real official mark, omit the `logo` field on the node and leave the drawer without an image until a real file is supplied. Same rule for people: never invent portraits.

### Naming Convention
Use lowercase with hyphens:
- padron.png
- tatuaje.png
- my-father.png
- drew-estate.png

### How to Add
1. Put the .png file in this folder with the correct name.
2. Add this line to the node in data.js:
   logo: "logos/filename.png"

Example:
{ 
  id: "padron", 
  name: "Padrón", 
  ...
  logo: "logos/padron.png" 
}
