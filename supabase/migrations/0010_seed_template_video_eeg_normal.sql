-- Novo modelo "Vídeo-EEG Normal", a partir de um laudo de exemplo enviado
-- pela Dra. Monica. É um exame mais longo (monitorização prolongada), por
-- isso o texto tem mais seções que os modelos de EEG de rotina — mas segue
-- a mesma tipografia/padrão visual da plataforma (título h1, rótulos em
-- negrito, "Impressão" sem caixa alta com espaço extra acima). Dados
-- específicos do paciente de exemplo (medicação em uso, horário exato do
-- registro, ano de início das crises) foram removidos do texto-base, como
-- nos demais modelos, para não virar um padrão incorreto.

insert into public.report_templates (name, content_html)
values (
  'Vídeo-EEG Normal',
  '<h1>VÍDEO-ELETROENCEFALOGRAMA</h1>
<p><strong>Condições técnicas</strong>: Vídeo-EEG digital, realizado ambulatorialmente, em condições técnicas satisfatórias. Utilizados eletrodos de escalpo dispostos conforme Sistema Internacional 10-20 e eletrodos extracranianos para registro de eletrocardiograma. Aquisição de dados com taxa de amostragem de 256 amostras por canal por segundo, banda de filtro 0,5-70Hz e constante de tempo de 0.3 segundos. Registro de vigília e sono espontâneo e provas de ativação com fotoestimulação intermitente e hiperventilação.<br><strong>Duração:</strong> Aproximadamente 4 horas de registro.</p>
<p style="margin-top: 1.5rem;"><strong>Contexto clínico:</strong></p>
<p>Paciente com diagnóstico prévio de Epilepsia. Vídeo-EEG solicitado para melhor avaliação e caracterização dos eventos paroxísticos, visando à investigação de crises focais com comprometimento da consciência ou paroxismos de natureza não epiléptica.</p>
<p style="margin-top: 1.5rem;"><strong>Descrição do registro eletroencefalográfico</strong></p>
<p><strong>Atividade de base:</strong></p>
<p>Atividade elétrica cerebral contínua, simétrica, reativa, apresentando boa diferenciação anteroposterior, com ritmo dominante posterior na faixa alfa, reativo à abertura e fechamento ocular, com adequada modulação por atividade na faixa beta. Na sonolência, observa-se fragmentação do ritmo dominante posterior e alentecimento difuso da atividade elétrica cerebral. No sono, observam-se elementos próprios do estado, como ondas agudas do vértex, fusos do sono e complexos K de morfologia e topografias habituais.</p>
<p>A hiperventilação não evocou anormalidades.</p>
<p>A fotoestimulação intermitente não evocou anormalidades.</p>
<p><strong>Atividade interictal:</strong></p>
<p>Ausência de atividade paroxística de caráter epileptiforme.</p>
<p style="margin-top: 1.5rem;"><strong>Principais achados clínicos:</strong></p>
<p>Durante o período de registro não foram evidenciadas manifestações clínicas.</p>
<p><strong>Conclusão:</strong></p>
<ol>
<li>Atividade elétrica cerebral de base adequada para a idade durante vigília e sono.</li>
<li>Ausência de atividade epileptiforme.</li>
</ol>
<p style="margin-top: 1.5rem;"><em><strong>Impressão</strong></em>: <u>Vídeo-EEG prolongado em vigília e sono sem anormalidades eletrográficas significativas. A ausência de atividade epileptiforme interictal durante o período de monitorização não exclui o diagnóstico de Epilepsia. Não foram registrados eventos clínicos de interesse durante o exame, impossibilitando a correlação eletroclínica e limitando a caracterização dos paroxismos investigados. Os achados devem ser interpretados em conjunto com os dados clínicos e semiológicos.</u></p>'
);
