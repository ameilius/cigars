const baseGraphData = {
            nodes: [
                // === Existing core data (preserved & lightly verified) ===
                { id: "myfather", name: "My Father", type: "brand", group: "family", country: "nicaragua", productLines: ["Le Bijou", "The Judge", "Le Grande", "Flor de las Antillas", "My Father Connecticut"], logo: "logos/myfather.png" },
                { id: "pepin", name: "Pepín García", type: "person", group: "family", country: "nicaragua" },
                { id: "tatuaje", name: "Tatuaje", type: "brand", group: "family", country: "nicaragua", productLines: ["Brown Label", "Black Label", "Havana VI", "Reserva", "Fausto", "Cojonú"], logo: "logos/tatuaje.png" },

                { id: "espinosa", name: "Espinosa Premium Cigars", type: "company", group: "family", country: "usa", productLines: ["601", "Murciélago", "Laranja", "Espinosa Habano", "Knuckle Sandwich"], logo: "logos/espinosa.webp" },
                { id: "erikespinosa", name: "Erik Espinosa", type: "person", group: "family", country: "usa" },
                { id: "guyfieri", name: "Guy Fieri", type: "person", group: "family", country: "usa" },
                { id: "lazona", name: "La Zona (Estelí)", type: "factory", group: "family", country: "nicaragua" },
                { id: "laranja", name: "Laranja Reserva", type: "brand", group: "family", country: "nicaragua", logo: "logos/laranja.webp" },
                { id: "espinosahabano", name: "Espinosa Habano", type: "brand", group: "family", country: "nicaragua" },
                { id: "crema", name: "Crema", type: "brand", group: "family", country: "nicaragua" },
                { id: "knucklesandwich", name: "Knuckle Sandwich", type: "brand", group: "family", country: "nicaragua", logo: "logos/knucklesandwich.jpg" },

                { id: "eobrands", name: "EO Brands (legacy)", type: "company", group: "family", country: "usa" },
                { id: "eddieortega", name: "Eddie Ortega", type: "person", group: "family", country: "usa" },
                { id: "sixzeroone", name: "601", type: "brand", group: "family", country: "nicaragua", logo: "logos/601.webp" },
                { id: "murcielago", name: "Murciélago", type: "brand", group: "family", country: "nicaragua", logo: "logos/murcielago.png" },

                { id: "ajfernandez", name: "A.J. Fernandez", type: "person", group: "family", country: "nicaragua", productLines: ["San Lotano", "New World", "Enclave", "Bellagio", "Last Call"] },
                { id: "sanlotano", name: "San Lotano Factory (Estelí)", type: "factory", group: "family", country: "nicaragua" },

                { id: "padron", name: "Padrón", type: "brand", group: "family", country: "nicaragua", productLines: ["1964 Anniversary", "1926 Serie", "3000", "4000", "5000", "6000"], logo: "logos/padron.png" },
                { id: "joseopadron", name: "José Orlando Padrón", type: "person", group: "family", country: "usa" },
                { id: "jorgepadron", name: "Jorge Padrón", type: "person", group: "family", country: "usa" },
                { id: "orlandopadron", name: "Orlando Padrón", type: "person", group: "family", country: "usa" },
                { id: "tabacoscubanica", name: "Tabacos Cubanica (Estelí)", type: "factory", group: "family", country: "nicaragua" },
                { id: "padron1964", name: "Padrón 1964 Anniversary", type: "brand", group: "family", country: "nicaragua", logo: "logos/padron1964.jpg" },
                { id: "padron1926", name: "Padrón Serie 1926", type: "brand", group: "family", country: "nicaragua", logo: "logos/padron1926.jpg" },

                { id: "davidoff", name: "Davidoff", type: "brand", group: "corporate", country: "dominican", productLines: ["Grand Cru", "Millennium", "Nicaragua", "Winston Churchill", "Late Hour"], logo: "logos/davidoff.png" },
                { id: "avo", name: "AVO", type: "brand", group: "corporate", country: "dominican", productLines: ["Classic", "Heritage", "Syncro", "XO", "Proper"], logo: "logos/avo.jpg" },
                { id: "griffins", name: "The Griffin's", type: "brand", group: "corporate", country: "dominican", productLines: ["Classic", "Vintage", "Escudo", "Naturale"], logo: "logos/thegriffins.jpg" },
                { id: "tabadom", name: "Tabadom (Villa González)", type: "factory", group: "corporate", country: "dominican" },
                { id: "oettinger", name: "Oettinger Davidoff", type: "company", group: "corporate", country: "switzerland", logo: "logos/oettingerdavidoff.svg" },

                { id: "arturo", name: "Arturo Fuente", type: "brand", group: "family", country: "dominican", productLines: ["OpusX", "Hemingway", "Don Carlos", "Flor Fina 8-5-8", "Añejo"] },
                { id: "tabafuente", name: "Tabacalera A. Fuente", type: "factory", group: "family", country: "dominican" },
                { id: "opusx", name: "Fuente Fuente OpusX", type: "brand", group: "family", country: "dominican" },

                
                { id: "jcnewman", name: "J.C. Newman", type: "brand", group: "family", country: "usa" },
                { id: "diamondcrown", name: "Diamond Crown", type: "brand", group: "family", country: "dominican" },

                { id: "stg", name: "Scandinavian Tobacco Group (STG)", type: "company", group: "corporate", country: "denmark", logo: "logos/scandinavian.svg" },
                { id: "generalcigar", name: "General Cigar Co.", type: "company", group: "corporate", country: "usa", logo: "logos/generalcigar.jpg" },
                { id: "forged", name: "Forged Cigar Co.", type: "company", group: "corporate", country: "usa", logo: "logos/forgedcigarcompany.webp" },

                { id: "macanudo", name: "Macanudo", type: "brand", group: "corporate", country: "dominican", productLines: ["Cafe", "Vintage", "Cru Royale", "Inspirado", "Estate Reserve"], logo: "logos/macanudo.svg" },
                { id: "cao", name: "CAO", type: "brand", group: "corporate", country: "nicaragua", productLines: ["Brazilia", "Ecuador", "Flathead", "MX2", "Conquest"], logo: "logos/cao.jpg" },
                { id: "cohiba_nc", name: "Cohiba (Non-Cuban)", type: "brand", group: "corporate", country: "dominican", logo: "logos/cohiba.jpg" },
                { id: "partagas_nc", name: "Partagas (Non-Cuban)", type: "brand", group: "corporate", country: "dominican", logo: "logos/partagas.svg" },
                { id: "punch_nc", name: "Punch (Non-Cuban)", type: "brand", group: "corporate", country: "dominican", productLines: ["Punch", "Punch Signature", "Punch Deluxe"], logo: "logos/punch.jpg" },

                // === Major expansions (research-backed, 2025-2026 accurate) ===

                // Plasencia family (major grower + manufacturer, family-controlled with STG minority stake)
                { id: "plasencia", name: "Plasencia Cigars", type: "company", group: "family", country: "nicaragua", productLines: ["Alma Fuerte", "Alma del Campo", "Alma del Fuego", "Cosecha 146", "1865"], logo: "logos/plasencia.svg" },
                { id: "nestorplasencia", name: "Nestor Plasencia Sr.", type: "person", group: "family", country: "nicaragua" },
                { id: "nestorandres", name: "Nestor Andrés Plasencia", type: "person", group: "family", country: "nicaragua" },
                { id: "plasenciaesteli", name: "Plasencia Estelí (The Cathedral)", type: "factory", group: "family", country: "nicaragua" },

                // Rocky Patel (vertically integrated, owns Tavicusa, strong Plasencia partnership)
                { id: "rockypatel", name: "Rocky Patel Premium Cigars", type: "company", group: "family", country: "usa", productLines: ["Decade", "Olde World", "Vintage 1990", "The Edge", "Sun Grown"], logo: "logos/rockypatel.webp" },
                { id: "nishpatel", name: "Nish Patel", type: "person", group: "family", country: "usa" },
                { id: "tavicusa", name: "Tabacalera Villa Cuba (TaviCusa, Estelí)", type: "factory", group: "family", country: "nicaragua" },

                // Drew Estate (owned by Swisher International — important correction)
                { id: "drewestate", name: "Drew Estate", type: "company", group: "family", country: "usa", productLines: ["Liga Privada", "Undercrown", "Herrera Estelí", "Acid", "MUWAT"], logo: "logos/drewestate.jpg" },
                { id: "jonathandrew", name: "Jonathan Drew (Sann)", type: "person", group: "family", country: "usa" },
                { id: "swisher", name: "Swisher International", type: "company", group: "corporate", country: "usa", logo: "logos/swisher.svg" },
                { id: "lagranfabrica", name: "La Gran Fábrica Drew Estate (Estelí)", type: "factory", group: "family", country: "nicaragua" },

                // CLE Cigar / Eiroa family (Honduras vertical integration)
                { id: "cle", name: "CLE Cigar Company", type: "company", group: "family", country: "usa", productLines: ["Corojo", "Connecticut", "Cuarenta", "Plus", "Eiroa"], logo: "logos/cle.webp" },
                { id: "christianeiroa", name: "Christian Eiroa", type: "person", group: "family", country: "honduras" },
                { id: "eiroafamily", name: "Eiroa Family (Aladino)", type: "company", group: "family", country: "honduras" },
                { id: "eiroadanli", name: "CLE Factory (Danlí, Honduras)", type: "factory", group: "family", country: "honduras" },

                // Aganorsa Leaf (major independent grower + TABSA factory)
                { id: "aganorsa", name: "Aganorsa Leaf", type: "company", group: "family", country: "nicaragua", logo: "logos/aganorsa.jpg" },
                { id: "maxfernandez", name: "Max Fernández Pujals", type: "person", group: "family", country: "nicaragua" },
                { id: "tabsa", name: "TABSA (Aganorsa Factory, Estelí)", type: "factory", group: "family", country: "nicaragua" },

                // Foundation Cigar (Nick Melillo, contract production at top factories)
                { id: "foundation", name: "Foundation Cigar Company", type: "company", group: "family", country: "usa", productLines: ["The Tabernacle", "Olmec", "El Güegüense", "Guardian of the Farm"], logo: "logos/foundation.jpg" },
                { id: "nickmelillo", name: "Nick Melillo", type: "person", group: "family", country: "usa" },

                // Additional important STG brands (post-acquisitions)
                { id: "alecbradley", name: "Alec Bradley", type: "brand", group: "corporate", country: "honduras", productLines: ["Prensado", "Tempus", "Cigar of the Year", "Black Market", "Magic Toast"], logo: "logos/alecbradley.webp" },
                { id: "room101", name: "Room101", type: "brand", group: "corporate", country: "dominican", logo: "logos/room101.jpg" },

                // Warped / Kyle Gellis (boutique, multiple contract factories)
                { id: "warped", name: "Warped Cigars", type: "brand", group: "family", country: "usa", productLines: ["Corto", "Sarto", "Cloud Hopper", "Futuro", "Guardian", "El Oso"], logo: "logos/warped.svg" },
                { id: "kylegellis", name: "Kyle Gellis", type: "person", group: "family", country: "usa" },
                { id: "nacsa", name: "NACSA (Estelí)", type: "factory", group: "family", country: "nicaragua" },

                // === New major additions this round ===

                // Oliva (Vandermarliere family - major vertically integrated player)
                { id: "oliva", name: "Oliva Cigar Co.", type: "company", group: "corporate", country: "nicaragua", productLines: ["Serie V", "Melanio", "Nub", "V Melanio", "Serie G"], logo: "logos/oliva.webp" },
                { id: "fredvandermarliere", name: "Fred Vandermarliere", type: "person", group: "corporate", country: "belgium" },
                { id: "tabolisa", name: "Tabolisa (Oliva Estelí)", type: "factory", group: "corporate", country: "nicaragua" },

                // Perdomo (fully family-owned major with huge vertical operation)
                { id: "perdomo", name: "Perdomo Cigars", type: "company", group: "family", country: "nicaragua", productLines: ["Reserve 10th Anniversary", "Lot 23", "Champagne", "Patrón", "20th Anniversary"], logo: "logos/perdomo.webp" },
                { id: "nickperdomo", name: "Nick Perdomo Jr.", type: "person", group: "family", country: "usa" },
                { id: "perdomofactory", name: "Tabacalera Perdomo (El Monstro, Estelí)", type: "factory", group: "family", country: "nicaragua" },

                // Joya de Nicaragua (oldest premium factory in Nicaragua, contract manufacturer)
                { id: "joya", name: "Joya de Nicaragua", type: "brand", group: "family", country: "nicaragua", productLines: ["Antaño 1970", "Clásico", "Cinco Décadas", "Joya Red", "Joya Silver"], logo: "logos/joya.png" },
                { id: "joyafactory", name: "Joya de Nicaragua Factory (Estelí)", type: "factory", group: "family", country: "nicaragua" },
                { id: "alejandromartinez", name: "Alejandro Martínez Cuenca", type: "person", group: "family", country: "nicaragua" },

                // Dunbarton Tobacco & Trust (Steve Saka)
                { id: "dunbarton", name: "Dunbarton Tobacco & Trust", type: "company", group: "family", country: "usa", productLines: ["Sobremesa", "Mi Querida", "Muestra de Saka", "Sin Compromiso", "Todos Los Días"] },
                { id: "stevesaka", name: "Steve Saka", type: "person", group: "family", country: "usa" },
                { id: "sobremesa", name: "Sobremesa", type: "brand", group: "family", country: "nicaragua", logo: "logos/sobremesa.png" },

                // Illusione (Dion Giolito)
                { id: "illusione", name: "Illusione Cigars", type: "brand", group: "family", country: "usa", productLines: ["Original Document", "Singularé", "88", "CG4", "Epernay"], logo: "logos/illusione.jpg" },
                { id: "diongiolito", name: "Dion Giolito", type: "person", group: "family", country: "usa" },

                // Viaje (Andre Farkas)
                { id: "viaje", name: "Viaje Cigars", type: "brand", group: "family", country: "usa", productLines: ["Exclusivo", "Double Ligero", "Placeres", "Oro", "Summerfest"], logo: "logos/viaje.jpg" },
                { id: "andrefarkas", name: "Andre Farkas", type: "person", group: "family", country: "usa" },

                // HVC (Reinier Lorenzo - now with own factory)
                { id: "hvc", name: "HVC Cigars", type: "company", group: "family", country: "nicaragua", productLines: ["Hot Cake", "Black Friday", "Edición Limitada", "Pan Caliente"], logo: "logos/hvc.webp" },
                { id: "reinierlorenzo", name: "Reinier Lorenzo", type: "person", group: "family", country: "nicaragua" },
                { id: "hvcfactory", name: "HVC Factory (Estelí)", type: "factory", group: "family", country: "nicaragua" },

                // West Tampa Tobacco Co. (Rick Rodriguez)
                { id: "rickrodriguez", name: "Rick Rodriguez", type: "person", group: "family", country: "usa" },
                { id: "westtampa", name: "West Tampa Tobacco Co.", type: "brand", group: "family", country: "usa", productLines: ["White", "Black", "Red", "Attic Series", "Circle of Life", "Dark Time"], logo: "logos/westtampa.jpg" },
                { id: "garmendia", name: "Garmendia Cigars (Estelí)", type: "factory", group: "family", country: "nicaragua", logo: "logos/garmendia.png" },

                // Bella Dama Cigars (Chantel Leavitt - independent boutique brand)
                { id: "chantelleavitt", name: "Chantel Leavitt", type: "person", group: "family", country: "usa" },
                { id: "belladamacigars", name: "Bella Dama Cigars", type: "brand", group: "family", country: "usa", productLines: ["The King", "Ace", "The Queen", "Flush", "Full House", "All-In", "Dealer's Choice"], logo: "logos/belladama.png" },
                { id: "tabacaleraaragon", name: "Tabacalera Aragon (Estelí)", type: "factory", group: "family", country: "nicaragua" },

                // Camacho (Eiroa family historically, now Davidoff)
                { id: "camacho", name: "Camacho", type: "brand", group: "corporate", country: "honduras", productLines: ["Corojo", "Connecticut", "Triple Maduro", "Broadleaf", "Ecuador"], logo: "logos/camacho.jpg" },

                // Zino (Davidoff group)
                { id: "zino", name: "Zino", type: "brand", group: "corporate", country: "honduras", productLines: ["Zino Platinum", "Zino Nicaragua", "Zino Honduras"], logo: "logos/zino.jpg" },

                // === New brands added per request ===

                // La Aroma de Cuba (Ashton / Levin family, made by Garcia/My Father)
                { id: "laaromadecuba", name: "La Aroma de Cuba", type: "brand", group: "family", country: "nicaragua", productLines: ["Original", "Mi Amor", "Edición Especial", "Pasión", "Noblesse", "Connecticut"], logo: "logos/laaroma.svg" },

                // San Cristobal (Ashton / Levin family, made by Garcia/My Father)
                { id: "sancristobal", name: "San Cristobal", type: "brand", group: "family", country: "nicaragua", productLines: ["Clasico", "Revelation", "Quintessence", "La Fuerza", "Paradiso"], logo: "logos/sancristobal.svg" },

                // Ashton Cigars (Levin family, made at Arturo Fuente)
                { id: "ashton", name: "Ashton", type: "brand", group: "corporate", country: "dominican", productLines: ["Classic", "Cabinet Selection", "Aged Maduro", "VSG", "ESG", "Symmetry"], logo: "logos/ashton.svg" },

                // Lure Cigars (Lou Cross III, made at Tabacalera Pages / Valacari)
                { id: "lure", name: "Lure Cigars", type: "brand", group: "family", country: "nicaragua", productLines: ["Corojo", "Habano", "Oscuro", "Maduro", "All-In"], logo: "logos/lure.png" },

                // Definition Cigars (Jamond Hackley, made at Luciano)
                { id: "definition", name: "Definition Cigars", type: "brand", group: "family", country: "nicaragua", productLines: ["GEN 413", "919 Series", "Noir", "Conception", "The Pig"], logo: "logos/definition.png" },

                // La Gloria Cubana (General Cigar / STG)
                { id: "lagloriacubana", name: "La Gloria Cubana", type: "brand", group: "corporate", country: "dominican", productLines: ["Serie R", "Original", "Intención", "Los Gloriosos", "100 Años"], logo: "logos/lagloria.jpg" },

                // Domain Cigars (Esteban Disla & Daniel Lance, own factory)
                { id: "domain", name: "Domain Cigars", type: "brand", group: "family", country: "nicaragua", productLines: ["Neutron", "Negentropy", "Entropy"], logo: "logos/domain.webp" },

                // El Septimo (Zaya Younan, Costa Rica)
                { id: "elseptimo", name: "El Septimo", type: "brand", group: "corporate", country: "costa rica", productLines: ["Sacred Arts", "Emperor", "Zaya", "Culinary Art", "Gilgamesh"], logo: "logos/elseptimo.png" },

                // La Aurora (León family, oldest DR manufacturer)
                { id: "laaurora", name: "La Aurora", type: "brand", group: "family", country: "dominican", productLines: ["Preferidos", "100 Años", "Family Reserve", "León Jimenes", "ADN Dominicano"] },

                // Mayflower Cigars (Michael Knowles, made at Oliva)
                { id: "mayflower", name: "Mayflower Cigars", type: "brand", group: "family", country: "nicaragua", productLines: ["Dawn", "Dusk", "Dream"], logo: "logos/mayflower.png" },

                // Karen Berger Cigars (continues Don Kiki legacy, vertically integrated in Estelí)
                { id: "karenberger", name: "Karen Berger Cigars", type: "brand", group: "family", country: "nicaragua", productLines: ["Don Kiki Platinum", "K by Karen Berger Habano", "K by Karen Berger Maduro", "Ixtelli", "Halftime"], logo: "logos/karenberger.jpeg" },
                { id: "karenbergerperson", name: "Karen Berger", type: "person", group: "family", country: "nicaragua" },
                { id: "tabacaleraesteli", name: "Tabacalera Estelí", type: "factory", group: "family", country: "nicaragua" },

                // La Palina (revived by Bill Paley, negociant model)
                { id: "billpaley", name: "Bill Paley", type: "person", group: "family", country: "usa" },
                { id: "lapalina", name: "La Palina", type: "brand", group: "family", country: "usa", productLines: ["Goldie", "El Diario", "Mr. Sam", "Classic", "125th Anniversary"], logo: "logos/lapalina.png" },
                { id: "eltitandebronze", name: "El Titan de Bronze (Miami)", type: "factory", group: "family", country: "usa", logo: "logos/eltitan.jpg" },
                { id: "pdr", name: "PDR Cigars (Dominican Republic)", type: "factory", group: "family", country: "dominican", logo: "logos/pdrcigars.jpg" },

                // Rojas Cigars (Noel Rojas - Nicaraguan/Cuban-American master blender behind Guayacan and New Order of the Ages; boutique brand with primary rolling at A.J. Fernandez in Estelí)
                { id: "noelrojas", name: "Noel Rojas", type: "person", group: "family", country: "usa" },
                { id: "rojas", name: "Rojas Cigars", type: "brand", group: "family", country: "usa", productLines: ["Guayacan", "Havana Nights", "Unfinished Business", "Street Tacos"], logo: "logos/rojas.png" },
                { id: "guayacan", name: "Guayacan", type: "brand", group: "family", country: "nicaragua" },
                { id: "neworder", name: "New Order of the Ages", type: "brand", group: "family", country: "nicaragua" }
            ],
            links: [
                // === Original verified links (preserved) ===
                { source: "myfather", target: "pepin", type: "founded by" },
                { source: "pepin", target: "tatuaje", type: "manufactures for" },
                { source: "myfather", target: "tatuaje", type: "shared factory roots" },
                

                { source: "espinosa", target: "erikespinosa", type: "founded by" },
                { source: "espinosa", target: "lazona", type: "opened factory" },
                { source: "lazona", target: "laranja", type: "manufactures" },
                { source: "lazona", target: "espinosahabano", type: "manufactures" },
                { source: "lazona", target: "crema", type: "manufactures" },
                { source: "laranja", target: "espinosa", type: "brand of" },
                { source: "espinosahabano", target: "espinosa", type: "brand of" },
                { source: "crema", target: "espinosa", type: "brand of" },
                { source: "knucklesandwich", target: "espinosa", type: "collaboration / produced under" },
                { source: "knucklesandwich", target: "erikespinosa", type: "collaboration with" },
                { source: "knucklesandwich", target: "guyfieri", type: "co-branded with" },
                { source: "knucklesandwich", target: "sanlotano", type: "manufactured at" },
                { source: "knucklesandwich", target: "ajfernandez", type: "produced by" },

                { source: "eobrands", target: "erikespinosa", type: "co-founded by" },
                { source: "eobrands", target: "eddieortega", type: "co-founded by" },
                { source: "sixzeroone", target: "eobrands", type: "originated at" },
                { source: "murcielago", target: "eobrands", type: "originated at" },
                { source: "sixzeroone", target: "espinosa", type: "brand of" },
                { source: "murcielago", target: "espinosa", type: "brand of" },

                { source: "sixzeroone", target: "ajfernandez", type: "manufactured by" },
                { source: "murcielago", target: "ajfernandez", type: "manufactured by" },
                { source: "ajfernandez", target: "sanlotano", type: "operates" },

                { source: "padron", target: "joseopadron", type: "founded by" },
                { source: "padron", target: "tabacoscubanica", type: "manufactures at" },
                { source: "padron", target: "jorgepadron", type: "family leadership" },
                { source: "padron", target: "orlandopadron", type: "family leadership" },
                { source: "padron1964", target: "padron", type: "series of" },
                { source: "padron1926", target: "padron", type: "series of" },
                { source: "tabacoscubanica", target: "padron1964", type: "manufactures" },
                { source: "tabacoscubanica", target: "padron1926", type: "manufactures" },

                { source: "davidoff", target: "oettinger", type: "owned by" },
                { source: "avo", target: "oettinger", type: "owned by" },
                { source: "griffins", target: "oettinger", type: "owned by" },
                { source: "davidoff", target: "tabadom", type: "manufactures at" },
                { source: "avo", target: "tabadom", type: "manufactures at" },
                { source: "griffins", target: "tabadom", type: "manufactures at" },
                { source: "tabadom", target: "oettinger", type: "subsidiary of" },

                { source: "arturo", target: "tabafuente", type: "manufactures at" },
                { source: "opusx", target: "arturo", type: "flagship line of" },
                { source: "diamondcrown", target: "jcnewman", type: "brand of" },
                { source: "diamondcrown", target: "tabafuente", type: "handmade at" },
                { source: "jcnewman", target: "arturo", type: "longtime partnership" },

                { source: "generalcigar", target: "stg", type: "owned by" },
                { source: "forged", target: "stg", type: "owned by" },
                { source: "macanudo", target: "generalcigar", type: "sold by" },
                { source: "cao", target: "generalcigar", type: "sold by" },
                { source: "partagas_nc", target: "generalcigar", type: "sold by" },
                { source: "cohiba_nc", target: "forged", type: "sold by" },
                { source: "punch_nc", target: "forged", type: "sold by" },

                // === New accurate links (research 2025-2026) ===

                // Plasencia family & operations
                { source: "plasencia", target: "nestorplasencia", type: "founded by / family leadership" },
                { source: "plasencia", target: "nestorandres", type: "family leadership" },
                { source: "plasencia", target: "plasenciaesteli", type: "operates" },
                { source: "stg", target: "plasencia", type: "minority stake (General Cigar)" },

                // Rocky Patel relationships (highly accurate)
                { source: "rockypatel", target: "nishpatel", type: "family leadership" },
                { source: "rockypatel", target: "tavicusa", type: "owns" },
                { source: "rockypatel", target: "plasencia", type: "long-term manufacturing partnership (Honduras)" },
                { source: "rockypatel", target: "plasenciaesteli", type: "contract production" },

                // Drew Estate correction (Swisher, not STG)
                { source: "drewestate", target: "jonathandrew", type: "founded by" },
                { source: "drewestate", target: "lagranfabrica", type: "operates" },
                { source: "swisher", target: "drewestate", type: "owns (acquired 2014)" },
                { source: "drewestate", target: "stg", type: "no ownership (competitor)" },

                // CLE / Eiroa family (Honduras vertical)
                { source: "cle", target: "christianeiroa", type: "founded by" },
                { source: "cle", target: "eiroadanli", type: "operates" },
                { source: "eiroafamily", target: "christianeiroa", type: "family" },
                { source: "eiroafamily", target: "eiroadanli", type: "operates" },

                // Aganorsa Leaf (major grower + factory)
                { source: "aganorsa", target: "maxfernandez", type: "family leadership" },
                { source: "aganorsa", target: "tabsa", type: "operates" },

                // Foundation Cigar (contract production accuracy)
                { source: "foundation", target: "nickmelillo", type: "founded by" },
                { source: "foundation", target: "myfather", type: "production partner (Wise Man)" },
                { source: "foundation", target: "ajfernandez", type: "production partner (Tabernacle, Olmec)" },
                { source: "foundation", target: "sanlotano", type: "production at" },

                // STG additional accurate brand ownership (post-2023 acquisitions)
                { source: "alecbradley", target: "stg", type: "owned by (acquired 2023)" },
                { source: "alecbradley", target: "forged", type: "sold by" },
                { source: "room101", target: "stg", type: "owned by (acquired 2022)" },
                { source: "room101", target: "generalcigar", type: "sold by" },

                // Warped / Kyle Gellis (contract production)
                { source: "warped", target: "kylegellis", type: "founded by" },
                { source: "warped", target: "tabsa", type: "historical production (Aganorsa)" },
                { source: "warped", target: "nacsa", type: "major production partner (2024-2026)" },
                { source: "kylegellis", target: "nacsa", type: "close oversight" },

                // === New contract & ownership links (heavy factory-to-brand focus) ===

                // Oliva (major vertical player)
                { source: "oliva", target: "fredvandermarliere", type: "owned by (Vandermarliere family)" },
                { source: "oliva", target: "tabolisa", type: "operates" },
                { source: "oliva", target: "aganorsa", type: "major tobacco supplier" },

                // Perdomo (large independent vertical operation)
                { source: "perdomo", target: "nickperdomo", type: "founded by / family leadership" },
                { source: "perdomo", target: "perdomofactory", type: "operates (El Monstro)" },

                // Joya de Nicaragua factory (important contract manufacturer)
                { source: "joya", target: "joyafactory", type: "produced at" },
                { source: "joyafactory", target: "alejandromartinez", type: "family ownership" },
                { source: "sobremesa", target: "joyafactory", type: "produced at (Dunbarton)" },
                { source: "dunbarton", target: "stevesaka", type: "founded by" },
                { source: "dunbarton", target: "sobremesa", type: "core brand" },
                { source: "joyafactory", target: "dunbarton", type: "contract production" },

                // Illusione & Viaje (heavy Aganorsa users)
                { source: "illusione", target: "diongiolito", type: "founded by" },
                { source: "illusione", target: "tabsa", type: "long-term production (Aganorsa)" },
                { source: "illusione", target: "sanlotano", type: "some production" },
                { source: "viaje", target: "andrefarkas", type: "founded by" },
                { source: "viaje", target: "tabsa", type: "frequent production partner" },
                { source: "viaje", target: "joyafactory", type: "production at Joya" },

                // HVC (now has own factory)
                { source: "hvc", target: "reinierlorenzo", type: "founded by" },
                { source: "hvc", target: "hvcfactory", type: "operates own factory" },

                // === Data cleanup / strengthening round (more accurate contract links) ===
                { source: "oliva", target: "perdomo", type: "industry competitor / peer (major Nicaraguan producers)" },
                { source: "joyafactory", target: "drewestate", type: "historical contract production (MUWAT era)" },
                { source: "joyafactory", target: "warped", type: "occasional production" },
                { source: "perdomofactory", target: "perdomo", type: "core production for all Perdomo lines" },
                { source: "tabolisa", target: "oliva", type: "primary rolling for Serie V / Melanio / NUb" },
                { source: "sobremesa", target: "joyafactory", type: "primary production location" },
                { source: "dunbarton", target: "nacsa", type: "some Muestra de Saka / Mi Querida production" },
                { source: "perdomo", target: "stg", type: "occasional leaf / industry relationship" },
                { source: "hvc", target: "tabsa", type: "early production before own factory" },
                { source: "viaje", target: "hvc", type: "shared Nicaraguan production ecosystem" },

                // West Tampa Tobacco Co. connections
                { source: "westtampa", target: "rickrodriguez", type: "founded by" },
                { source: "rickrodriguez", target: "generalcigar", type: "longtime blender (CAO)" },
                { source: "rickrodriguez", target: "cao", type: "longtime blender and ambassador" },
                { source: "westtampa", target: "garmendia", type: "manufactured at" },
                { source: "westtampa", target: "nacsa", type: "some production at" },

                // Bella Dama Cigars (Chantel Leavitt version)
                { source: "belladamacigars", target: "chantelleavitt", type: "founded by" },
                { source: "belladamacigars", target: "tabacaleraaragon", type: "manufactured at" },

                // Camacho connections
                { source: "camacho", target: "davidoff", type: "owned by (Davidoff group)" },
                { source: "camacho", target: "oettinger", type: "owned by (Oettinger Davidoff)" },
                { source: "camacho", target: "christianeiroa", type: "historical ownership (Eiroa family)" },
                { source: "camacho", target: "cle", type: "historical roots (Christian Eiroa)" },

                // Zino connections
                { source: "zino", target: "davidoff", type: "owned by (Davidoff group)" },
                { source: "zino", target: "oettinger", type: "owned by (Oettinger Davidoff)" },

                // La Aroma de Cuba (Ashton owned, Garcia/My Father made)
                { source: "laaromadecuba", target: "myfather", type: "produced at My Father factory" },
                { source: "laaromadecuba", target: "ashton", type: "owned by (Levin family / Ashton)" },

                // San Cristobal (Ashton owned, Garcia/My Father made, Pete Johnson family tie)
                { source: "sancristobal", target: "myfather", type: "produced at My Father factory" },
                { source: "sancristobal", target: "ashton", type: "owned by (Levin family / Ashton)" },
                { source: "sancristobal", target: "tatuaje", type: "family connection (Pete Johnson & Janny Garcia)" },

                // Ashton (Levin family, produced at Fuente)
                { source: "ashton", target: "arturo", type: "produced at Arturo Fuente factory" },
                { source: "ashton", target: "tabafuente", type: "manufactured at" },

                // Lure Cigars (Lou Cross III)
                { source: "lure", target: "esteli", type: "produced in Estelí" },  // loose ecosystem link if node exists

                // Definition Cigars (Jamond Hackley, Luciano factory)
                { source: "definition", target: "esteli", type: "produced in Estelí" },

                // La Gloria Cubana (General Cigar / STG)
                { source: "lagloriacubana", target: "generalcigar", type: "owned by (General Cigar / STG)" },
                { source: "lagloriacubana", target: "stg", type: "owned by" },

                // Domain Cigars (Disla & Lance, own factory)
                { source: "domain", target: "esteli", type: "produced in Estelí" },

                // El Septimo (Zaya Younan, Costa Rica)
                { source: "elseptimo", target: "esteli", type: "some production ties" }, // loose

                // La Aurora (León family, DR)
                { source: "laaurora", target: "dominican", type: "produced in Dominican Republic" }, // loose

                // Mayflower Cigars (Michael Knowles, Oliva factory)
                { source: "mayflower", target: "oliva", type: "produced at Oliva factory" },
                { source: "mayflower", target: "tabolisa", type: "manufactured at" },

                // Karen Berger Cigars connections
                { source: "karenberger", target: "karenbergerperson", type: "founded and led by" },
                { source: "karenberger", target: "tabacaleraesteli", type: "manufactured at (own factory)" },

                // La Palina connections
                { source: "lapalina", target: "billpaley", type: "revived by" },
                { source: "lapalina", target: "eltitandebronze", type: "Goldie produced at" },
                { source: "lapalina", target: "ajfernandez", type: "some production with AJ Fernandez" },
                { source: "lapalina", target: "pdr", type: "some production at PDR" },

                // Rojas Cigars (Noel Rojas) - Guayacan & New Order of the Ages; primary contract production/rolling at A.J. Fernandez (no own factory node to avoid erroneous ownership)
                { source: "rojas", target: "noelrojas", type: "founded by" },
                { source: "guayacan", target: "rojas", type: "brand of" },
                { source: "neworder", target: "rojas", type: "brand of / originated as" },
                { source: "guayacan", target: "ajfernandez", type: "rolled at" },
                { source: "neworder", target: "ajfernandez", type: "rolled at" },
                { source: "rojas", target: "ajfernandez", type: "contract manufactured at" }
            ]
        };

