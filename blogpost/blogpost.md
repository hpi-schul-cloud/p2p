# Bessere Benutzbarkeit von Internetseiten bei schlechter Internetanbindung durch Übertragung von Inhalten über das lokale Netzwerk

## Schlechte Internetanbindung an deutschen Schulen
Wer kennt es nicht? Der Unterricht ist gut vorbereitet, Aufgabe der Schüler ist es unter Zuhilfenahme des Internets selbst Stoff zu erarbeiten. Hierzu sollen ausgewählte Videos und andere interaktive Webseiten studiert werden. Einziges Problem: Das Internet ist viel zu langsam, die Schüler können die Videos nur Stück für Stück ansehen, auf den interaktiven Seiten werden die Bilder nur nach und nach geladen. Die Schüler sind genervt, die Lernbereitschaft zerstört und somit auch die eigentlich gut durchdachte Unterrichtsstunde. 

Auch wir vom Hasso Plattner Institut waren mal in der Schule und kennen genau dieses Problem. Zeit also sich eine Lösung hierfür zu überlegen, diese zu implementieren und sie vorzustellen.

## Die Idee
Die Ursache für das oben beschriebene (Horror-) Szenario ist so gut wie immer eine zu geringe zur Verfügung stehenden Datenrate der Internetanbindung. Dieser Flaschenhals, lässt sich aufgrund des eingeschränkten Ausbaus des deutschen Internetnetzes und oft mangelnder finanzieller Mittel der Schulen nicht auflösen. 

Die grundlegende Idee besteht deshalb darin, die Internetanbindung zu entlasten. Da oft alle Schüler nahezu die gleichen Ressourcen aus dem Internet anfragen, könnte dies dadurch realisiert werden, dass die Inhalte im lokalen Netzwerk verteilt werden. Unter der Annahme, das in einer Schulklasse etwa 30 Schüler sind, könnte die Internetanbindung um bis zu Faktor 30 entlastet werden. Beachtet man zusätzlich, dass nicht nur eine Klasse gleichzeitig die Internetanbindung der Schule nutzt, ergibt sich ein noch größeres Optimierungspotential.

Eine grafische Gegenüberstellung der aktuellen bzw. der Situation, wie sie durch lokale Datenübertragung erreicht werden könnte zeigen die folgenden beiden Abbildungen.

alle Ressourcen werden aus dem Internet geladen | Ressourcen werden im lokalen Netzwerk verteilt  
:-------------------------:|:-------------------------:
![](./pictures/current_situation.svg)  |  ![](./pictures/goal.svg)

Insgesamt geht es darum die Benutzbarkeit von Internetseiten mit datenintensiven Inhalten deutlich zu steigern. Wichtig hierfür ist, dass die lokale Verbreitung der Inhalte schneller abläuft, als das Laden dieser aus dem Internet. 

Um den Wartungsaufwand seitens der Schulen so gering wie möglich zu halten ist es ebenfalls wünschenswert, dass keine zusätzliche Software installiert werden muss. Im Endeffekt soll keiner der Nutzer, weder Schüler noch Lehrer,  mitbekommen, dass etwas anders ist. Außer natürlich, dass die Inhalte schneller geladen werden und die entsprechende Internetseite so deutlich benutzbarer ist.

## Beispielszenario
Um eine Idee zu bekommen, wie eine Verbreitung von Daten aus dem Internet im Lokalen Netz im laufenden Betrieb aussehen könnte hier ein kleines Beispiel:

Der Unterricht beginnt und es wird den Schülern mitgeteilt, dass sie eine bestimmte Internetseite aufrufen und sich die darauf befindlichen multimedialen Inhalte ansehen sollen.

Ein bestimmter Schüler (Bob) ist der erste im Klassenverbund, der eine etwas größere Ressource (nehmen wir beispielhaft ein Video V) ansehen möchte. 
Zunächst wird geprüft, ob sich V evtl. schon in einem Zwischenspeicher auf Bobs Computer befindet. Gehen wir davon aus, dass dies nicht der Fall ist.

In Folge dessen lädt Bobs Browser V aus dem Internet und legt es im Anschluss in einen Zwischenspeicher ab. 

Einen Augenblick später möchte eine Schülerin (Alice) ebenfalls auf V zugreifen. Auch hier wird zunächst überprüft, ob sich V schon im lokalen  Zwischenspeicher befindet. Auch hier gehen wir davon aus, dass dies nicht der Fall ist. Folglich muss V von extern angefragt werden. 

Normalerweise würde Alices Browser V, so wie bei Bob, aus dem Internet anfragen. In unserem Szenario fragt sie aber zunächst alle im Klassenverbund befindliche Schüler, bzw. dessen Computer bezüglich V an.

Da Bob V bereits vorliegen hat, kann sie V direkt von Bob erhalten. Hierbei geschieht die Übertragung ausschließlich über das lokale Netzwerk, wodurch die Internetanbindung nicht belastet wird.

Nachdem Alice V von Bob erhalten hat legt sie V in ihren eigenen Zwischenspeicher ab. Fragt nun ein weiterer Schüler V an, kann er sie sowohl von Bob als auch von Alice erhalten. 

## Demo

Das oben beschriebene Szenario auf einer Webseite, realisiert mit unserer Softwarelösung, zeigt das folgende Video Beispielhaft.

<div align="center">
  <a href="https://drive.google.com/open?id=1MoI6pnDDNAFQpy4c0LvSPyTjphW0AUpR"><img src="./pictures/video.png" alt="IMAGE ALT TEXT"></a>
</div>

Im linken (schwarzen) Fenster wird kontinuierlich durch ein *ping* an die URL *google.com* überprüft, ob im Moment eine Internetverbindung besteht. 

Im rechten Fester ist eine Testseite geöffnet. Insgesamt bietet diese eine Bild als eine vergleichsweise kleine Ressource, ein gif als eine vergleichsweise große und ein Video als eine sehr große Ressource an. 
Im ersten Teil sieht man, wie ein Nutzer alle drei Ressourcen anfragt und darstellt. 

Zum Zeitpunkt *00:45* wird auf den Bildschirm eines zweiten Nutzers umgeschaltet. Auch hier wird links kontinuierlich die Internetanbindung geprüft. Der Nutzer fragt auch hier alle drei Ressourcen an. Diese werden allerdings nicht über das Internet geladen, sondern vom ersten Nutzer. 

Dass die Ressourcen wirklich über das lokale Netz geladen werden sieht man ab *01:10*. Wie links zu sehen ist, besteht ab diesem Zeitpunkt keine Verbindung mehr zum Internet. Dennoch kann das Video abgespielt werden.  

### Implementation
Bezüglich der konkreten Implementation ergeben sich mehrere Fragen, auf die im Folgenden eingegangen wird. 

### Wie wird die Zwischenspeicherung der Daten realisiert?
Für unsere Implementation wird für das Zwischenspeichern von Daten ein *Serviceworker* eingesetzt. *Serviceworker* agieren wie ein Proxy zwischen dem Webbrowser und dem Server, welcher die Webseite bereitstellt.
Stellt ein Browser eine Anfrage, so wird diese vom *Serviceworker* abgefangen. Der *Serviceworker* schaut zunächst in seinem Cache, der sog. *IndexDB*, ob er die gestellte Anfrage beantworten kann. Ist dies nicht der Fall, so wird die Anfrage an den Webserver weitergeleitet. Wird die gleiche Anfrage nochmals gestellt, kann diese aus dem Cache beantwortet werden, da gestellte Anfragen eine gewisse Zeit lang zwischengespeichert werden.

<p align="center">
  <img src="./pictures/ServiceWorker.svg">
</p>




### Welche Technologie wird zum Austausch der Daten genutzt und wie wird eine Verbindung zwischen den Browsern zweier Schüler aufgebaut?

Die Von uns eingesetzte Technologie zur Übertragung von Daten zwischen Browsern ist *WebRTC*. *WebRTC* ist ein offener Standard und ermöglicht es Browser paarweise zwecks Datenaustausch zu verbinden. Der große Vorteil dieser Technologie ist, dass sie direkt von modernen Browsern unterstützt wird, wodurch keine zusätzliche Software installiert werden muss. Konkret wird von uns ein sog. *DataChannel* genutzt.

Aufbau eines *DataChannels* zwischen Alice und Bob:
Alice und Bob möchten einen wechselseitigen *DataChannel* zueinander aufbauen. Die Ausgangslage ist, dass Alice und Bob zwar jeweils wissen, dass es den anderen gibt, aber nicht wie der jeweils andere zu erreichen ist. Etwas technischer gesagt: Keiner der beiden kennt die IP-Adresse des Anderen. Um diese Problematik zu lösen, wissen sowohl Alice als auch Bob, wie sie einen Vermittlungsserver (*Signaling server*) erreichen können. 

Als erstes sendet Alice Informationen über sich bzw. über die Verbindung die sie aufbauen möchte an den *Signaling server*. Technisch ausgedrückt sendet sie eine *SDP-offer*, wobei SDP für *Session Description Protocol* steht. 

Diese *SDP-offer* leitet der *Signaling server* an Bob weiter. Dieser antwortet mit einer *SDP-answere*, welche Informationen über Bob enthält und über den *Signaling server* an Alice geleitet wird. 

Damit eine direkte Verbindung zwischen Alice und Bob aufgebaut werden kann müssen über den *Signaling server* noch weitere Informationen wie ICE-Kandidaten ausgetauscht werden. ICE steht hierbei für Interactive Conectivity Establishment und ist fester Bestandteil von *WebRTC*. Es ist für den Aufbau der Browser-zu-Browser-Verbindung verantwortlich. ICE-Kandidaten enthalten hauptsächlich Informationen darüber wie ein bestimmter Nutzer erreichbar ist (also z.B. private oder öffentliche IP-Adresse). Ermittelt werden diese ICE-Kandidaten mithilfe eines STUN-Servers und dem dazugehörigen Session Traversal Utilities for NAT (STUN) Protokoll. Wie der Name des Protokolls schon verrät, wird es vor allem benötigt um auch Nutzer erreichen zu können die keine eigene öffentliche IP-Adresse besitzen, bei denen also Network address translation (NAT) eingesetzt wird. Dies ist aufgrund der mangelnden Anzahl an IPv4-Adressen bei fast jedem Internetnutzer der Fall. 

## Wie weiß ein einzelner Browser welche anderen im Klassenverbund befindlichen Computer die von ihm angefragte Ressource vorliegen haben?

In unserer Implementation wird, sobald eine neuer Besucher der Webseite hinzukommt, sofort ein *DataChannel*, mittels *WebRTC*, *STUN*, *ICE* und *Signaling server* zu allen anderen aktiven Besuchern aufgebaut. 
Über diesen werden zu zwei Zeitpunkten Informationen darüber ausgetauscht, welche Ressourcen bei dem jeweiligen Nutzer vorliegen: Direkt nach Aufbau des *DataChannels* und immer dann, wenn ein Nutzer eine neue Ressource (aus dem Internet oder lokal) geladen und in seinem Cache gespeichert hat.

Folgende Abbildung zeigt ein ausführliches Ablaufdiagramm.
Client 1 (C1) ist der erste der die Webseite aufruft. Er registriert sich beim *Signaling server* und fragt im Anschluss *img.png* an. Da noch niemand anders auf der Seite ist von dem er die Ressource bekommen könnte und er zudem die Ressource nicht in seinem Cache hat, wird *img.png* über das Internet vom Webserver geladen. 
Client 2 (C2) ruft nun ebenfalls die Webseite auf und registriert sich beim *Signaling server*. Dieser benachrichtigt C1, dass ein neuer Teilnehmer registriert wurde, woraufhin C1 einen Verbindungsaufbau zu C2 einleitet. Steht die direkte Verbindung zwischen C1 und C2, teilt C1 C2 den Inhalt seines aktuellen Caches mit. Fragt C2 *img.png* an, weiß er so, dass er diese von C1 anfragen kann. Hat er *img.png* erhalten, teilt er allen anderen Teilnehmern (in diesem Fall nur C1) mit, dass auch er jetzt *img.png* als Ressource in seinem Cache hat.

<img src="./pictures/SequenceDiagram.svg">
