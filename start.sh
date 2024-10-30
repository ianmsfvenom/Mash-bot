while :
do
	printf "\033[92mSistema de reinício automático ligado! Iniciando bot...\033[0m\n\n"
	ts-node main.ts
	printf "\033[91mPrograma fechado! Iniciando bot novamente...\033[0m\n\n"
	sleep 1
done
