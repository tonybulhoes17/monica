-- Mais 4 modelos padrão, extraídos dos laudos de exemplo enviados pela
-- Dra. Monica. Como nos modelos anteriores, nome/idade/datas/solicitante
-- não entram no texto (já vêm da caixa de dados do paciente); dados que
-- eram específicos do paciente de exemplo (ex: medicação em uso) foram
-- removidos do texto-base, para não virar um padrão incorreto.

insert into public.report_templates (name, content_html) values
(
  'Vigília e Sonolência Adulto',
  '<h1>ELETROENCEFALOGRAMA DIGITAL COM MAPEAMENTO CEREBRAL</h1>
<p><strong>Condições técnicas</strong>: EEG com mapeamento cerebral digital, realizado ambulatorialmente, em condições técnicas satisfatórias. Utilizados eletrodos convencionais disposto conforme Sistema Internacional 10-20 e eletrodos extracranianos para registro de eletrocardiograma. Aquisição de dados com taxa de amostragem de 256 amostras por canal por segundo, banda de filtro 0,5-70Hz e constante de tempo de 0.3 segundos. Realizadas provas de ativação com fotoestimulação intermitente e hiperventilação. Paciente sem uso de fármaco anticrise.</p>
<p><strong>Duração:</strong> 60 minutos.</p>
<p><strong>Motivo/Indicação clínica:</strong> Paciente com histórico de TCE grave e crise epiléptica sintomática aguda.</p>
<p><strong>Principais achados:</strong></p>
<p>A atividade de base é organizada e simétrica, apresentando boa diferenciação anteroposterior, com ritmo dominante posterior na faixa alfa (9-10 Hz), reativo a abertura e fechamento ocular, com adequação modulação por atividade na faixa beta. Na sonolência, observa-se fragmentação do ritmo dominante posterior a alentecimento difuso da atividade elétrica cerebral.</p>
<p>A hiperventilação não evocou anormalidades.</p>
<p>A fotoestimulação intermitente não evocou anormalidades.</p>
<p>Não foi observada atividade epileptiforme.</p>
<p><strong>Conclusão:</strong></p>
<p>EEG digital com mapeamento cerebral, em vigília e sonolência, registrando:</p>
<ol>
<li>Atividade elétrica cerebral organizada e simétrica.</li>
<li>Não foi observada atividade epileptiforme.</li>
</ol>
<p><em><strong>IMPRESSÃO</strong></em>: <u>EEG normal.</u></p>'
),
(
  'Vigília e Sono - Epilepsia Generalizada Idiopática (exemplo anormal)',
  '<h1>ELETROENCEFALOGRAMA DIGITAL COM MAPEAMENTO CEREBRAL</h1>
<p><strong>Condições técnicas</strong>: EEG com mapeamento cerebral digital, realizado ambulatorialmente, em condições técnicas satisfatórias. Utilizados eletrodos convencionais disposto conforme Sistema Internacional 10-20 e eletrodos extracranianos para registro de eletrocardiograma. Aquisição de dados com taxa de amostragem de 256 amostras por canal por segundo, banda de filtro 0,5-70Hz e constante de tempo de 0.3 segundos. Realizadas provas de ativação com fotoestimulação intermitente e hiperventilação. Paciente sem uso de fármacos anticrise.</p>
<p><strong>Duração:</strong> 70 minutos.</p>
<p><strong>Motivo/Indicação clínica:</strong> Crise epiléptica.</p>
<p><strong>Principais achados:</strong></p>
<p>A atividade de base é organizada e simétrica, apresentando boa diferenciação anteroposterior, com ritmo dominante posterior na faixa alfa (9-10Hz), reativo a abertura e fechamento ocular, com adequação modulação por atividade na faixa beta. Na sonolência, observa-se fragmentação do ritmo dominante posterior a alentecimento difuso da atividade elétrica cerebral. No sono, observam-se elementos próprios do estado, como ondas agudas do vértex, fusos do sono e complexos K de morfologia e topografias habituais.</p>
<p>A hiperventilação não modificou significativamente o traçado.</p>
<p>A fotoestimulação intermitente não evocou anormalidades.</p>
<p>Foram registrados paroxismos epileptiforme com morfologia de complexos espícula-onda a 4-5 Hz, de projeção generalizada e maior amplitude em regiões frontais. Tais paroxismos ocorreram durante vigília e períodos de ativação com hiperventilação.</p>
<p><strong>Conclusão:</strong></p>
<p>EEG digital com mapeamento cerebral, em vigília e sono, registrando:</p>
<ol>
<li>Atividade elétrica cerebral organizada e simétrica.</li>
<li>Paroxismos epileptiformes frequentes com morfologia de complexo espícula onda de projeção generalizada durante vigília e ativação com fotoestimulação.</li>
</ol>
<p><em><strong>IMPRESSÃO</strong></em>: <u>EEG anormal. Registrada atividade epileptiforme de projeção generalizada. Em contexto clínico adequado, tais achados são sugestivos de Epilepsia Generalizada Idiopática.</u></p>'
),
(
  'Vigília Normal - Criança',
  '<h1>ELETROENCEFALOGRAMA DIGITAL COM MAPEAMENTO CEREBRAL</h1>
<p><strong>Condições técnicas</strong>: EEG com mapeamento cerebral digital, realizado ambulatorialmente, em condições técnicas satisfatórias. Utilizados eletrodos convencionais disposto conforme Sistema Internacional 10-20 e eletrodos extracranianos para registro de eletrocardiograma. Aquisição de dados com taxa de amostragem de 256 amostras por canal por segundo, banda de filtro 0,5-70Hz e constante de tempo de 0.3 segundos. Registro de vigília. Realizadas provas de ativação com fotoestimulação intermitente e hiperventilação.</p>
<p><strong>Duração:</strong> 50 minutos.</p>
<p><strong>Motivo/Indicação clínica:</strong> Epilepsia.</p>
<p><strong>Principais achados:</strong></p>
<p>A atividade de base é organizada e simétrica, apresentando boa diferenciação anteroposterior, com ritmo dominante posterior na faixa alfa (7-8Hz), reativo a abertura e fechamento ocular, além de modulação por atividade na faixa beta e algumas ondas na faixa teta em quantidade adequada para faixa etária.</p>
<p>A hiperventilação não evocou anormalidades.</p>
<p>A fotoestimulação intermitente não evocou anormalidades.</p>
<p>Não foi observada atividade epileptiforme.</p>
<p><strong>Conclusão:</strong></p>
<p>EEG digital com mapeamento cerebral, em vigília, registrando:</p>
<ol>
<li>Atividade elétrica cerebral em vigília organizada e simétrica.</li>
<li>Não foi observada atividade epileptiforme.</li>
</ol>
<p><em><strong>IMPRESSÃO</strong></em>: <u>EEG normal. A ausência de descargas epileptiformes durante o período de monitorização não afasta o diagnóstico de Epilepsia. Aproximadamente 50% dos pacientes com epilepsia podem apresentar EEG inicial normal, percentual que reduz progressivamente com a realização de registros seriados, incluindo EEG após privação de sono e vídeo-EEG prolongado, elevando a sensibilidade diagnóstica.</u></p>'
),
(
  'Sono Espontâneo Normal - Lactente',
  '<h1>ELETROENCEFALOGRAMA DIGITAL COM MAPEAMENTO CEREBRAL</h1>
<p><strong>Condições técnicas</strong>: EEG com mapeamento cerebral digital, realizado ambulatorialmente, em condições técnicas satisfatórias. Utilizados eletrodos convencionais disposto conforme Sistema Internacional 10-20 e eletrodos extracranianos para registro de eletrocardiograma. Aquisição de dados com taxa de amostragem de 256 amostras por canal por segundo, banda de filtro 0,5-70Hz e constante de tempo de 0.3 segundos. Registro de sono espontâneo e breve trecho em vigília. Realizada prova de ativação com fotoestimulação intermitente.</p>
<p><strong>Duração:</strong> 50 minutos.</p>
<p><strong>Motivo/Indicação clínica:</strong> Crise epiléptica.</p>
<p><strong>Principais achados:</strong></p>
<p>A atividade de base durante o sono é constituída por ondas lentas difusas nas faixas teta e delta, com alguma modulação por ritmos na faixa beta, entremeados a elementos fisiológicos do sono, como ondas do vértex e fusos do sono assíncronos, adequados para faixa etária.</p>
<p>Registrado breve trecho em vigília, com análise prejudicada por artefato de musculatura, ritmo de base composto por ondas teta a 5-6 Hz, com predomínio nas áreas posteriores, com alguma modulação por ritmos nas faixas alfa e beta, não sendo possível identificar um ritmo dominante posterior bem desenvolvido. A frequência dos ritmos próprios de vigília é adequada para faixa etária.</p>
<p>A fotoestimulação intermitente não evocou anormalidades.</p>
<p>Não foi observada atividade epileptiforme.</p>
<p><strong>Conclusão:</strong></p>
<p>EEG digital com mapeamento cerebral, em sono espontâneo, registrando:</p>
<ol>
<li>Atividade elétrica cerebral organizada e simétrica.</li>
<li>Não foi observada atividade epileptiforme.</li>
</ol>
<p><em><strong>IMPRESSÃO</strong></em>: <u>EEG normal.</u></p>'
);
