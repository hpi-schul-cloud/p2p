# Schulen, Digitalisierung, langsames Internet, langsames Arbeiten?

Wer kennt es nicht? Der Unterricht ist gut vorbereitet und Aufgabe der Schüler ist es unter Zuhilfenahme des Internets selbständig Unterrichtsinhalte zu recherchieren. Hierzu sollen ausgewählte Videos und andere interaktive Webseiten studiert werden. Einziges Problem: Das Internet ist viel zu langsam, die Schüler können die Videos nur Stück für Stück ansehen, auf den interaktiven Seiten werden die Bilder nur nach und nach geladen. Die Schüler sind genervt, die Lernbereitschaft sinkt und somit auch das Potential der eigentlich gut durchdachten Unterrichtsstunde. 

Auch wir vom Hasso Plattner Institut waren mal in der Schule und kennen genau dieses Problem; Zeit also sich eine Lösung zu überlegen.

## Verbesserungsbedarf!
Die Ursache für das oben beschriebene Szenario ist so gut wie immer auf eine zu geringe zur Verfügung stehenden Datenrate der Internetanbindung zurückzuführen. Dieser Flaschenhals lässt sich aufgrund des mangelden Breitbandausbaus oder mangelnder finanzieller Mittel der Schulen oft nicht lösen. 

Die grundlegende Idee besteht deshalb darin, die Internetanbindung zu entlasten. Da oft alle Schüler nahezu die gleichen Ressourcen aus dem Internet anfragen, könnte dies dadurch realisiert werden, dass die Inhalte im lokalen Netzwerk verteilt werden. Unter der Annahme, das in einer Schulklasse etwa 30 Schüler sind, könnte die Internetanbindung um bis zu Faktor 30 entlastet werden. Beachtet man zusätzlich, dass nicht nur eine Klasse gleichzeitig die Internetanbindung der Schule nutzt, ergibt sich ein noch größeres Optimierungspotential.

Eine grafische Gegenüberstellung der aktuellen bzw. der Situation, wie sie durch lokale Datenübertragung erreicht werden könnte, zeigen die folgenden beiden Abbildungen.

Alle Ressourcen werden aus dem Internet geladen | Ressourcen werden im lokalen Netzwerk verteilt  
:-------------------------:|:-------------------------:
![](./pictures/current_situation.svg)  |  ![](./pictures/goal.svg)

Insgesamt geht es darum die Benutzbarkeit von Internetseiten mit datenintensiven Inhalten deutlich zu steigern. Wichtig hierfür ist, dass die lokale Verbreitung der Inhalte schneller abläuft, als das Laden dieser aus dem Internet. 

Um den Wartungsaufwand seitens der Schulen so gering wie möglich zu halten, ist es ebenfalls wünschenswert, dass keine zusätzliche Software installiert werden muss. Im Endeffekt soll keiner der Nutzer, weder Schüler noch Lehrer,  mitbekommen, dass etwas anders ist. Außer natürlich, dass die Inhalte schneller geladen werden und die entsprechende Internetseite so deutlich benutzbarer ist.

## Beispielszenario
Um eine Idee zu bekommen, wie eine Verbreitung von Daten aus dem Internet im lokalen Netzwerk im laufenden Betrieb aussehen könnte hier ein kleines Beispiel:

Der Unterricht beginnt und es wird den Schülern mitgeteilt, dass sie eine bestimmte Internetseite aufrufen und sich die darauf befindlichen multimedialen Inhalte ansehen sollen.

Martin ist einer der ersten in der Klasse der ein Video zum gegebenen Thema findet und anguckt. In der Reihe hinter ihm wird Sina darauf aufmerksam und möchte sich dieses ebenfalls ansehen. Normalerweise würden Martin wie auch Sina das gesamte Video aus dem Internet anfragen und herunterladen. Doch warum fragt Sina's Computer nicht einfach bei Martin nach dem Video? Dieser hat dies und viele andere Dateien von der Internetseite ja bereits gelanden. Genau dort liegt unserer Ansatz: Die Computer innerhalb einer Klasse sollen einen Verband bilden und Ressourcen jeglicher Art für die Mitschüler zur Verfügung stellen und diese im lokalen Netwerk verteilen.

## Ein Prototyp

Das folgende Video zeigt mit einem protoypen beispielhaft das oben beschriebene Szenario:

<div align="center">
  <a href="https://drive.google.com/open?id=1MoI6pnDDNAFQpy4c0LvSPyTjphW0AUpR"><img src="./pictures/video.png" alt="IMAGE ALT TEXT"></a>
</div>

Im linken (schwarzen) Fenster wird kontinuierlich überprüft, ob eine Internetverbindung besteht. Im rechten Fester ist eine Testseite geöffnet. Insgesamt bietet diese eine Bild als eine vergleichsweise kleine Ressource, ein gif als eine vergleichsweise große und ein Video als eine sehr große Ressource an. 

Im ersten Teil sieht man, wie ein Nutzer alle drei Ressourcen anfragt und darstellt. Zum Zeitpunkt *00:45* wird auf den Bildschirm eines zweiten Nutzers umgeschaltet. Auch hier wird links kontinuierlich die Internetanbindung geprüft. Der Nutzer fragt auch hier alle drei Ressourcen an. Diese werden allerdings nicht über das Internet geladen, sondern vom ersten Nutzer. 

Das die Ressourcen wirklich über das lokale Netz geladen werden, sieht man ab *01:10*. Wie links zu sehen ist, besteht ab diesem Zeitpunkt keine Verbindung mehr zum Internet. Dennoch kann das Video abgespielt werden.  

ToDo: Hier Outro für non-techies!

## Technische Details
Bezüglich der konkreten Implementation ergeben sich mehrere Fragen, auf die im Folgenden eingegangen wird. 

#### Wie wird die Zwischenspeicherung der Daten realisiert?
Für unsere Implementation wird für das Zwischenspeichern von Daten ein *Serviceworker* eingesetzt. *Serviceworker* können wie ein Proxy zwischen dem Webbrowser und dem Webserver agieren, welcher die Webseite bereitstellt.
Stellt ein Browser eine Anfrage, so wird diese vom *Serviceworker* abgefangen. Der *Serviceworker* schaut zunächst in seinem Cache, der sog. *IndexDB*, ob er die gestellte Anfrage beantworten kann. Ist dies nicht der Fall, so wird die Anfrage an den Webserver weitergeleitet. Wird die gleiche Anfrage nochmals gestellt, kann diese aus dem Cache beantwortet werden, da gestellte Anfragen eine gewisse Zeit lang zwischengespeichert werden.

<p align="center">
  <img src="./pictures/ServiceWorker.svg">
</p>

#### Welche Technologie wird zum Austausch der Daten genutzt?

Die von uns eingesetzte Technologie zur Übertragung von Daten zwischen Browsern ist *WebRTC*. *WebRTC* ist ein offener Standard und ermöglicht es Browser paarweise zwecks Datenaustausch zu verbinden. Der große Vorteil dieser Technologie ist, dass sie direkt von modernen Browsern unterstützt wird, wodurch keine zusätzliche Software installiert werden muss. Konkret wird von uns ein sog. *DataChannel* genutzt.

#### Wie wird eine Verbindung zwischen den Browsern zweier Schüler aufgebaut?

Für den Datenaustausch müssen wechselseitig *DataChannel* zueinander aufgebaut werden. Die Ausgangslage ist, dass die Schüler wissen, dass es den anderen gibt, aber nicht wie der jeweils andere zu erreichen ist. Um diese Problematik zu lösen, existiert ein Vermittlungsserver (*Signaling server*). 

Als erstes werden Informationen, über die Verbindung die aufgebaut werden soll, an den *Signaling server* gesendet. Technisch wird ein *SDP-offer* gesendet, wobei SDP für *Session Description Protocol* steht. Dieses *SDP-offer* leitet der *Signaling server* an die Schüler in der Klasse/Schule weiter. Geantworted wird mit einer *SDP-answere*, welche Informationen über die abgestimmte Verbindung enthält und über den *Signaling server* zurück geleitet wird. 

Damit eine direkte Verbindung aufgebaut werden kann, müssen über den *Signaling server* noch weitere Informationen wie ICE-Kandidaten ausgetauscht werden. ICE steht hierbei für Interactive Conectivity Establishment und ist fester Bestandteil von *WebRTC*. Es ist für den Aufbau der Browser-zu-Browser-Verbindung verantwortlich. ICE-Kandidaten enthalten hauptsächlich Informationen darüber wie ein bestimmter Nutzer erreichbar ist (also z.B. private oder öffentliche IP-Adresse). Ermittelt werden diese ICE-Kandidaten mithilfe eines STUN-Servers und dem dazugehörigen Session Traversal Utilities for NAT (STUN) Protokoll. Wie der Name des Protokolls schon verrät, wird es vor allem benötigt um auch Nutzer erreichen zu können die keine eigene öffentliche IP-Adresse besitzen, bei denen also Network address translation (NAT) eingesetzt wird. Dies ist aufgrund der mangelnden Anzahl an IPv4-Adressen bei fast jedem Internetnutzer der Fall. 

#### Was steckt hinter dem *Signaling server*?

In dem *Signaling server* selbst wird die Logik abgebildet, wie die Klassen und Schüler miteinader in Verbindung stehen. Implementiert wurde dieser mit *socket.io*, da die native Klassenorganisation und Websocket-Technologie sich nahezu perfekt für unser Szenario anbot.

#### Wie weiß ein einzelner Browser welche anderen im Klassenverbund befindlichen Computer die von ihm angefragte Ressource vorliegen haben?

In unserer Implementation wird, sobald eine neuer Besucher der Webseite hinzukommt, sofort ein *DataChannel*, mittels *WebRTC*, *STUN*, *ICE* und *Signaling server* zu allen anderen aktiven Besuchern aufgebaut. 
Über diesen werden zu zwei Zeitpunkten Informationen darüber ausgetauscht, welche Ressourcen bei dem jeweiligen Nutzer vorliegen: Direkt nach Aufbau des *DataChannels* und immer dann, wenn ein Nutzer eine neue Ressource (aus dem Internet oder lokal) geladen und in seinem Cache gespeichert hat:

<img src="./pictures/SequenceDiagram.svg">

Client 1 (C1) ist der erste der die Webseite aufruft. Er registriert sich beim *Signaling server* und fragt im Anschluss *img.png* an. Da noch niemand anders auf der Seite ist von dem er die Ressource bekommen könnte und er zudem die Ressource nicht in seinem Cache hat, wird *img.png* über das Internet vom Webserver geladen. 
Client 2 (C2) ruft nun ebenfalls die Webseite auf und registriert sich beim *Signaling server*. Dieser benachrichtigt C1, dass ein neuer Teilnehmer registriert wurde, woraufhin C1 einen Verbindungsaufbau zu C2 einleitet. Steht die direkte Verbindung zwischen C1 und C2, teilt C1 C2 den Inhalt seines aktuellen Caches mit. Fragt C2 *img.png* an, weiß er so, dass er diese von C1 anfragen kann. Hat er *img.png* erhalten, teilt er allen anderen Teilnehmern (in diesem Fall nur C1) mit, dass auch er jetzt *img.png* als Ressource in seinem Cache hat.

Hier fehlt noch ein technischer Ausblick!