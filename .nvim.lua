local ok_lspconfig, lspconfig = pcall(require, 'lspconfig')
if ok_lspconfig and lspconfig.eslint then
  lspconfig.eslint.setup({
    settings = {
      format = { enable = true },
      validate = 'on',
    },
  })

  vim.api.nvim_create_autocmd('BufWritePre', {
    pattern = { '*.js', '*.jsx', '*.ts', '*.tsx' },
    callback = function()
      vim.lsp.buf.format({
        async = false,
        filter = function(client)
          return client.name == 'eslint'
        end,
      })
    end,
  })
end

local ok_conform, conform = pcall(require, 'conform')
if ok_conform then
  conform.setup({
    formatters_by_ft = {
      javascript = { 'eslint_d' },
      javascriptreact = { 'eslint_d' },
      typescript = { 'eslint_d' },
      typescriptreact = { 'eslint_d' },
    },
  })
end
