-- Primeiro modelo padrão, a partir do laudo de exemplo enviado pela Dra.
-- Monica (Vigília e Sono Adulto). O corpo já vem com achados/conclusão
-- típicos de EEG normal — a Dra. Monica ajusta o texto conforme o paciente
-- antes de assinar. Nome/idade/datas/solicitante não entram aqui: já são
-- preenchidos automaticamente a partir do cadastro do paciente/exame.

insert into public.report_templates (name, content_html)
values (
  'Vigília e Sono Adulto',
  '<h1>ELETROENCEFALOGRAMA DIGITAL COM MAPEAMENTO CEREBRAL</h1>
<p><strong>Condições técnicas</strong>: EEG com mapeamento cerebral digital, realizado ambulatorialmente, em condições técnicas satisfatórias. Utilizados eletrodos convencionais disposto conforme Sistema Internacional 10-20 e eletrodos extracranianos para registro de eletrocardiograma. Aquisição de dados com taxa de amostragem de 256 amostras por canal por segundo, banda de filtro 0,5-70Hz e constante de tempo de 0.3 segundos. Realizadas provas de ativação com fotoestimulação intermitente e hiperventilação. Paciente sem uso de fármaco anticrise.</p>
<p><strong>Duração:</strong> 50 minutos.</p>
<p><strong>Motivo/Indicação clínica:</strong> Investigação de paroxismo sugestivo de crise epiléptica.</p>
<p><strong>Principais achados:</strong></p>
<p>A atividade de base é organizada e simétrica, apresentando boa diferenciação anteroposterior, com ritmo dominante posterior na faixa alfa (10-11 Hz), reativo a abertura e fechamento ocular, com adequação modulação por atividade na faixa beta.</p>
<p>Na sonolência, observa-se fragmentação do ritmo dominante posterior a alentecimento difuso da atividade elétrica cerebral. No sono, observam-se elementos próprios do estado, como ondas agudas do vértex, fusos do sono e complexos K de morfologia e topografias habituais.</p>
<p>A hiperventilação não evocou anormalidades.</p>
<p>A fotoestimulação intermitente não evocou anormalidades.</p>
<p>Não foi observada atividade epileptiforme.</p>
<p><strong>Conclusão:</strong></p>
<ol>
<li>Atividade elétrica cerebral organizada e simétrica.</li>
<li>Não foi observada atividade epileptiforme.</li>
</ol>
<p><em><strong>IMPRESSÃO</strong></em>: <u>EEG normal.</u></p>'
);
