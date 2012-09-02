#Cryptocat
#### Browser Instant Messaging Platform with Accessible, Encrypted Messaging

## Description
Cryptocat is a browser-based XMPP client that provides multi-user (and private) instant messaging inside chatrooms. It uses the [OTR](http://www.cypherpunks.ca/otr/) protocol for encrypted two-party chat and the (upcoming) mpOTR protocol for encrypted multi-party chat.  

## Target platforms:
* Google Chrome: `src/chrome/`  
* Mozilla Firefox: `src/firefox/`  

## Documentation:
* [Threat Model](https://github.com/kaepora/cryptocat/wiki/Cryptocat-2-Threat-Model)  
* [Design and Functionality Overview](https://github.com/kaepora/cryptocat/wiki/Cryptocat-2-Design-and-Functionality)  
* [Architecture and Lifecycle](https://project.crypto.cat/documents/a&l.pdf)  

## License
#### Cryptocat is released under the [GNU Affero General Public License(AGPL3)](https://www.gnu.org/licenses/agpl-3.0.html):  
Copyright `(C)` 2011, 2012  Nadim Kobeissi <nadim@nadim.cc>  

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

## Notes:
**Alpha codebase!**
* Most recent changes in `testing/` directory, which is loadable in Chrome.
* Firefox development has not yet begun.

## Goals:
* XMPP **[DONE]** | [Discussion](https://github.com/kaepora/cryptocat/issues/83), [Library](http://strophe.im)
* OTR **[DONE]** | [Discussion](https://github.com/kaepora/cryptocat/issues/84), [Library](https://github.com/arlolra/otr)
* mpOTR | [Discussion](https://github.com/kaepora/cryptocat/issues/82), Spec in progress

## Discussion:
We have [a million issues worth discussing here!](https://github.com/kaepora/cryptocat/issues)
