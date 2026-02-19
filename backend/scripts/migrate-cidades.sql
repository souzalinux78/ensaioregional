
-- Ativar os novos campos com base no conteúdo de 'nome'
UPDATE cidades 
SET 
    nome_cidade = TRIM(UPPER(SUBSTRING_INDEX(nome, ' - ', 1))),
    nome_bairro = CASE 
        WHEN nome LIKE '% - %' THEN TRIM(UPPER(SUBSTRING_INDEX(nome, ' - ', -1)))
        ELSE NULL 
    END,
    nome_exibicao = CASE 
        WHEN nome LIKE '% - %' THEN CONCAT(TRIM(UPPER(SUBSTRING_INDEX(nome, ' - ', 1))), ' - ', TRIM(UPPER(SUBSTRING_INDEX(nome, ' - ', -1))))
        ELSE TRIM(UPPER(nome))
    END;
