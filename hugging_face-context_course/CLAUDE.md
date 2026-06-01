# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# 🤖 Diretrizes para o Ambiente de Aprendizado (Hugging Face)

Este arquivo serve como o manual de instruções e contexto para a IA ajudar o usuário no desenvolvimento de projetos e estudos focados nos cursos da **Hugging Face**.

---

## ⚡ Instruções de Inicialização (Obrigatório)

**Toda vez que este contexto for iniciado (seja pelo comando `/init`, leitura automática de regras ou no primeiro prompt do chat), você DEVE imediatamente:**

1.  **Verificar e Criar o Diário:** Verificar se o arquivo `NOTAS.md` já existe na raiz do projeto.
    *   Se **NÃO** existir, crie-o imediatamente com a estrutura base de cabeçalho definida abaixo.
    *   Se **JÁ** existir, não apague o conteúdo atual; apenas confirme ao usuário que o diário está pronto para receber novas notas.
2.  **Confirmar a Inicialização:** Responda ao usuário confirmando que leu este manual, que está pronto para o curso da Hugging Face e que o arquivo `NOTAS.md` foi verificado/criado com sucesso.

---

## 🛠️ Comandos de Desenvolvimento

### Instalação de Dependências
```bash
pip install transformers datasets evaluate accelerate gradio huggingface_hub
pip install torch torchvision torchaudio  # PyTorch (ajuste conforme CUDA disponível)
```

### Executar Notebooks
```bash
jupyter lab        # preferido — interface moderna
jupyter notebook   # alternativa clássica
```

### Executar Scripts Python
```bash
python nome_do_script.py
```

### Autenticação no Hugging Face Hub
```bash
huggingface-cli login   # necessário para push de modelos e datasets privados
```

### Verificar GPU disponível (Python)
```python
import torch
print(torch.cuda.is_available(), torch.cuda.get_device_name(0))
```

---

## 🎯 Objetivo do Ambiente
*   **Foco:** Aprendizado de IA, Processamento de Linguagem Natural (NLP), Modelos de Linguagem (LLMs), Visão Computacional e Áudio usando o ecossistema Hugging Face (`transformers`, `datasets`, `evaluate`, `accelerate`, `hub`).
*   **Abordagem:** Didática e iterativa. O objetivo principal é o aprendizado do usuário, não apenas a entrega de código pronto.

---

## 🛠️ Stack Tecnológica & Bibliotecas Comuns
*   **Linguagem:** Python 3.10+
*   **Ambientes:** Jupyter Notebooks (`.ipynb`) ou Scripts Python estruturados.
*   **Frameworks Principais:** PyTorch, TensorFlow/Keras (quando especificado).
*   **Hugging Face Ecosystem:** `transformers`, `datasets`, `evaluate`, `accelerate`, `hub`, `gradio`.

---

## 📜 Regras de Comportamento para a IA

Ao interagir neste ambiente, você **deve**:

1.  **Explicar o "Porquê":** Ao sugerir uma linha de código ou arquitetura, explique brevemente o conceito teórico por trás.
2.  **Tratamento de Recursos:** Sugira práticas de otimização quando relevante (ex: `fp16=True`, lotes menores, uso de `bitsandbytes` para quantização).
3.  **Códigos Modulares:** Forneça trechos de código limpos e bem comentados para células do Jupyter Notebook.
4.  **Atualização Automatizada do Diário (Muito Importante):** Sempre que concluirmos um aprendizado importante, resolvermos um bug complexo ou finalizarmos um módulo do curso, você deve sugerir o resumo estruturado para o usuário adicionar ao arquivo `NOTAS.md`.

---

## 📓 Estrutura Base para o Diário de Bordo (`NOTAS.md`)

Ao criar o arquivo pela primeira vez, use este template exato:

```markdown
# 📓 Diário de Bordo - Estudos Hugging Face

Este arquivo serve como um registro do meu progresso, conceitos aprendidos, snippets importantes e erros superados ao longo do curso da Hugging Face.

---

## Módulos Concluídos
<!-- Liste aqui os módulos finalizados com data -->

## Conceitos-Chave Aprendidos
<!-- Adicione resumos dos conceitos mais importantes -->

## Snippets Úteis
<!-- Código reutilizável que vale guardar -->

## Erros & Soluções
<!-- Bugs encontrados e como foram resolvidos -->
```
