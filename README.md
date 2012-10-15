﻿#Cryptocat
#### Browser Instant Messaging Platform with Accessible, Encrypted Messaging
#### Experimental software: Don't trust with your life! Peer review appreciated.

## Description
Cryptocat is a browser-based XMPP client that provides multi-user (and private) instant messaging inside chatrooms. It uses the [OTR](http://www.cypherpunks.ca/otr/) protocol for encrypted two-party chat and the (upcoming) mpOTR protocol for encrypted multi-party chat.  

## Target Platforms
##### Google Chrome: `src/chrome/`
Run `make chrome` to build a Google Chrome-loadable .zip extension (or just .zip the directory.)
##### Mozilla Firefox: `src/firefox/`
Run `make firefox` to build a Mozilla Firefox-loadable .xpi extension (or just .zip the directory and change the extension to .xpi.)
##### Apple Safari: `src/cryptocat.safariplugin/`
Apple's model makes an automated build process difficult.  

## Compatibility Status
```
  -----------------------------------------
 |             Windows   Mac      Linux    |
 |-----------------------------------------|
 | Chrome  |   Yes       Yes      Yes      |
 |---------                                |
 | Firefox |   Yes       Yes      Yes      |
 |---------                                |
 | Safari  |   Yes       Yes               |
 |---------                                |
  -----------------------------------------
```  

## Documentation & Wiki
* [Server Deployment Instructions](https://github.com/kaepora/cryptocat/wiki/Server-Deployment-Instructions)  
* [Threat Model](https://github.com/kaepora/cryptocat/wiki/Threat-Model)  
* [Design and Functionality Overview](https://github.com/kaepora/cryptocat/wiki/Design-and-Functionality)  
* [Architecture and Lifecycle](https://project.crypto.cat/documents/a&l.pdf)  

## License
#### Cryptocat is released under the [GNU Affero General Public License (AGPL3)](https://www.gnu.org/licenses/agpl-3.0.html):  
Copyright `(C)` 2011, 2012 Nadim Kobeissi <nadim@crypto.cat>  

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.  

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.  

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.  

The full license text is included in `LICENSE.txt`.  

## Notes
* Builds are available in `release/`.

## Goals
* XMPP **[DONE]** | [Discussion](https://github.com/kaepora/cryptocat/issues/83), [Library](http://strophe.im)
* OTR **[DONE]** | [Discussion](https://github.com/kaepora/cryptocat/issues/84), [Library](https://github.com/arlolra/otr)
* mpOTR | [Discussion](https://github.com/kaepora/cryptocat/issues/82), Spec in progress. Current mutli-party encryption is handled using [Cryptocat Protocol 2.0](https://project.crypto.cat/documents/)

## Discussion
We have [a million issues worth discussing here!](https://github.com/kaepora/cryptocat/issues)

## Contributors
* **Lead Developer**: Nadim Kobeissi  
* **Development Contributors**: Jacob Appelbaum, Joseph Bonneau, Arlo Breault, Arturo Filasto, Fabio Pietrosanti  
* **Multimedia Contributors**: A.J. Korkidakis, P.J. Onori, Rich Vreeland  
  
With a warm thanks to the hard-working contributors who wish to remain anonymous.