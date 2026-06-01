### Arquitetura Cliente-Servidor (FUNDAMENTOS)

Entenda como clientes e servidores se comunicam, o modelo request-response e como a internet funciona
por baixo dos panos.

# Conceitos-Chave
• Modelo cliente-servidor: request/response, stateless vs stateful
• DNS resolution, TCP/IP stack, portas e sockets
• Diferença entre servidor web, servidor de aplicação e banco de dados
• Conceito de latency, throughput e bandwidth

## Exercícios Práticos:

# Exercício 1: Servidor TCP em C
Implemente um servidor TCP puro em C que aceita conexões e responde com "Hello, Client!". Use socket(),
bind(), listen(), accept(). Depois implemente um cliente em Python que se conecta a ele.

# Exercício 2: Chat simples
Crie um chat TCP com Python (socket) onde múltiplos clientes se conectam a um servidor. Use threading
para conexões simultâneas.
# Exercício 3: Mini HTTP server
Usando apenas a lib socket do Python, construa um servidor que interpreta requisições HTTP GET e retorna
HTML estático. Não use frameworks.
#Exercício 4: DNS Lookup tool
Escreva um script em Python que faz resolução DNS manualmente usando a lib dnspython. Compare com
nslookup e dig.

## Mini-Projeto Integrador
Construa um sistema de file sharing p2p simplificado: um servidor central registra peers, e cada peer pode solicitar arquivos
de outros peers diretamente via TCP.

## Leituras Recomendadas
Beej's Guide to Network Programming (C), RFC 2616 (HTTP/1.1), "Computer Networking: A Top-Down
Approach" cap. 2.