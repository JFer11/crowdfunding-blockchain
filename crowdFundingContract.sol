import "@openzeppelin/contracts/access/Ownable.sol";

// En caso de utilizar dos contratos, es necesario hacer un approvalFrom?

contract CrowdfundingPlatform is Ownable {
    uint256 public fee;
    
    event AdminFeeWithdrawn(uint256 amount);
    
    constructor() {
        fee = 5; // default
    }

    // Función para configurar las criptomonedas aceptadas
    function setAcceptedTokens(/* Parámetros de criptomonedas aceptadas */) public onlyOwner {
        // ...
    }

    // Función para configurar el porcentaje de comisión
    function setPlatformFee( uint256  _newFee) public onlyOwner {
        require(_newFee > 0  && _newFee < 100, "Fee should be a percentage, between 0 and 100");
        fee = _newFee;
    }

    // El administrador de la plataforma deberá poder retirar lo recaudado en cualquier momento.
    // Que onda, si lo haces antes y no llega al goal, no se le puede devolver la totalidad a los inversores.
    // Hay que llevar un registro de si ya se saco el 5% de un inversor o no.
}
    
pragma solidity ^0.8.0;



